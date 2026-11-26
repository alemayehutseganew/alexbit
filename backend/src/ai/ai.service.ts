import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma.service';

type SimilarDocument = {
  id: string;
  content: string;
  distance: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function isEmbedding(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.length === 1536 &&
    value.every(
      (item: unknown) => typeof item === 'number' && Number.isFinite(item),
    )
  );
}

function isSimilarDocument(value: unknown): value is SimilarDocument {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.content === 'string' &&
    typeof value.distance === 'number'
  );
}

function isSimilarDocumentArray(value: unknown): value is SimilarDocument[] {
  return Array.isArray(value) && value.every(isSimilarDocument);
}

@Injectable()
export class AiService {
  constructor(private readonly prisma: PrismaService) {}

  async generateEmbedding(text: string): Promise<number[]> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new ServiceUnavailableException(
        'Document search is not configured',
      );
    }

    let response: Response;
    try {
      response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text,
        }),
      });
    } catch {
      throw new ServiceUnavailableException(
        'Unable to generate document search embedding',
      );
    }

    if (!response.ok) {
      throw new ServiceUnavailableException(
        'Unable to generate document search embedding',
      );
    }

    let result: unknown;
    try {
      result = await response.json();
    } catch {
      throw new ServiceUnavailableException(
        'Embedding provider returned an invalid response',
      );
    }

    const data = isRecord(result) ? result.data : undefined;
    const firstItem = isUnknownArray(data) ? data[0] : undefined;
    const embedding = isRecord(firstItem) ? firstItem.embedding : undefined;
    if (!isEmbedding(embedding)) {
      throw new ServiceUnavailableException(
        'Embedding provider returned an invalid vector',
      );
    }

    return embedding;
  }

  async searchSimilarDocuments(
    tenantId: string,
    query: string,
  ): Promise<SimilarDocument[]> {
    const embedding = await this.generateEmbedding(query);
    const vector = `[${embedding.join(',')}]`;

    const result = await this.prisma.$queryRaw<unknown>(
      Prisma.sql`
        SELECT "id", "content", "embedding" <=> ${vector}::vector AS "distance"
        FROM "DocumentEmbedding"
        WHERE "tenantId" = ${tenantId}
          AND "embedding" IS NOT NULL
        ORDER BY "embedding" <=> ${vector}::vector
        LIMIT 10
      `,
    );
    if (!isSimilarDocumentArray(result)) {
      throw new ServiceUnavailableException(
        'Document search returned an invalid result',
      );
    }

    return result;
  }
}
