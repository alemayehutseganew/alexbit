import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Prisma } from '@primehorizon/domain/prisma';
import PDFDocument from 'pdfkit';
import type { AppRole } from '../auth/authenticated-user';
import { PrismaService } from '../prisma.service';

type ProposalData = {
  organization: string;
  contactName: string;
  contactEmail: string;
  phone: string;
  projectDetails: string;
};

@Injectable()
export class DocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async generateProposalPdf(rfpData: ProposalData): Promise<Buffer> {
    const amharicFontPath = join(
      __dirname,
      '../../assets/NotoSansEthiopic-Regular.woff2',
    );
    const stampPath = join(__dirname, '../../assets/stamp.png');
    if (!existsSync(amharicFontPath) || !existsSync(stampPath)) {
      throw new InternalServerErrorException(
        'Proposal PDF font or stamp asset is not configured',
      );
    }

    const doc = new PDFDocument({ size: 'A4', margin: 56, bufferPages: true });
    const chunks: Buffer[] = [];
    const result = new Promise<Buffer>((resolve, reject) => {
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    doc.registerFont('NotoSansEthiopic', amharicFontPath);

    const pageWidth = doc.page.width;
    doc
      .rect(0, 0, pageWidth, 116)
      .fill('#0b4a8b')
      .fillColor('#ffffff')
      .fontSize(15)
      .text('PrimeHorizon Group Trading PLC', 56, 32, {
        width: pageWidth - 112,
      })
      .font('NotoSansEthiopic')
      .fontSize(13)
      .text('ፕራይም ሆራይዘን ግሩፕ ትሬዲንግ ኃ/የተ/የግ/ማህበር', 56, 61, {
        width: pageWidth - 112,
      })
      .font('Helvetica');

    doc.y = 144;
    doc.fillColor('#111827').fontSize(22).text('Project Proposal');
    doc.moveDown(1.25);
    doc.fontSize(10).fillColor('#64748b').text('CLIENT ORGANIZATION');
    doc.moveDown(0.35);
    doc.fontSize(15).fillColor('#111827').text(rfpData.organization);
    doc.moveDown(1);
    doc.fontSize(10).fillColor('#64748b').text('CONTACT INFORMATION');
    doc.moveDown(0.35);
    doc
      .fontSize(11)
      .fillColor('#334155')
      .text(rfpData.contactName)
      .text(rfpData.contactEmail)
      .text(rfpData.phone);
    doc.moveDown(1);
    doc.fontSize(10).fillColor('#64748b').text('DATE');
    doc.moveDown(0.35);
    doc
      .fontSize(11)
      .fillColor('#334155')
      .text(
        new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(new Date()),
      );
    doc.moveDown(1);
    doc.fontSize(10).fillColor('#0b4a8b').text('PROJECT DETAILS');
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#334155').text(rfpData.projectDetails, {
      lineGap: 5,
    });

    doc.moveDown(2);
    const footerY = doc.page.height - doc.page.margins.bottom - 100;
    if (doc.y > footerY - 20) {
      doc.addPage();
    }

    doc
      .fontSize(9)
      .fillColor('#475569')
      .text('PrimeHorizon Group Trading PLC', 56, footerY + 36)
      .text('Phone: 0914230500', 56, footerY + 51);

    doc.image(stampPath, pageWidth - 168, footerY, { fit: [110, 75] });
    doc
      .fontSize(8)
      .fillColor('#64748b')
      .text('Authorized Signature', pageWidth - 176, footerY + 78, {
        width: 116,
        align: 'center',
      });

    const range = doc.bufferedPageRange();
    for (
      let index = range.start;
      index < range.start + range.count;
      index += 1
    ) {
      doc.switchToPage(index);
      if (index > range.start && index < range.start + range.count - 1) {
        doc
          .fontSize(9)
          .fillColor('#475569')
          .text(
            'PrimeHorizon Group Trading PLC | Phone: 0914230500',
            56,
            footerY + 80,
            {
              width: pageWidth - 112,
              align: 'center',
            },
          );
      }
    }

    doc.end();
    return result;
  }

  async generateAcceptedRfpProposal(
    rfpId: string,
    role: AppRole,
    tenantId: string,
  ): Promise<Buffer> {
    try {
      const rfp = await this.prisma.rfpRequest.findUnique({
        where: { id: rfpId },
        select: {
          organization: true,
          contactName: true,
          contactEmail: true,
          phone: true,
          projectDetails: true,
          status: true,
          tenantId: true,
        },
      });

      if (
        !rfp ||
        rfp.status !== 'ACCEPTED' ||
        (role === 'PROJECT_MANAGER' && rfp.tenantId !== tenantId)
      ) {
        throw new NotFoundException('Accepted RFP not found');
      }

      return this.generateProposalPdf(rfp);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          'Unable to generate proposal document',
        );
      }
      throw error;
    }
  }
}
