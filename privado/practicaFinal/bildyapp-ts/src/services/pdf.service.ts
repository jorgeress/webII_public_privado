// src/services/pdf.service.ts

import PDFDocument from 'pdfkit';
import type { IDeliveryNote } from '../models/DeliveryNote.js';
import type { IUser } from '../models/User.js';
import type { IClient } from '../models/Client.js';
import type { IProject } from '../models/Project.js';

interface PdfData {
  note: IDeliveryNote;
  user: IUser;
  client: IClient;
  project: IProject;
  signatureImageUrl?: string;
}

export async function generateDeliveryNotePdf(data: PdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const { note, user, client, project } = data;

    // ── Cabecera ──────────────────────────────────────────────────────────────
    doc.fontSize(22).fillColor('#2563eb').text('BildyApp', { align: 'right' });
    doc.fontSize(14).fillColor('#1e293b').text('ALBARÁN DE TRABAJO', { align: 'right' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown(1);

    // ── Datos del emisor ──────────────────────────────────────────────────────
    doc.fontSize(10).fillColor('#64748b').text('EMISOR');
    doc.fontSize(11).fillColor('#1e293b')
      .text(`${user.name ?? ''} ${user.lastName ?? ''}`.trim())
      .text(user.email);
    doc.moveDown(1);

    // ── Datos del cliente ─────────────────────────────────────────────────────
    doc.fontSize(10).fillColor('#64748b').text('CLIENTE');
    doc.fontSize(11).fillColor('#1e293b')
      .text(client.name)
      .text(`CIF: ${client.cif}`);
    if (client.email) doc.text(client.email);
    if (client.address?.city) doc.text(`${client.address.city}`);
    doc.moveDown(1);

    // ── Datos del proyecto ────────────────────────────────────────────────────
    doc.fontSize(10).fillColor('#64748b').text('PROYECTO');
    doc.fontSize(11).fillColor('#1e293b')
      .text(project.name)
      .text(`Código: ${project.projectCode}`);
    doc.moveDown(1);

    // ── Detalles del albarán ──────────────────────────────────────────────────
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').stroke();
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#64748b').text('DETALLES DEL ALBARÁN');
    doc.moveDown(0.3);

    const workDate = new Date(note.workDate).toLocaleDateString('es-ES');
    doc.fontSize(11).fillColor('#1e293b')
      .text(`Fecha de trabajo: ${workDate}`)
      .text(`Tipo: ${note.format === 'hours' ? 'Horas trabajadas' : 'Materiales'}`);

    if (note.description) doc.text(`Descripción: ${note.description}`);
    doc.moveDown(0.5);

    if (note.format === 'hours') {
      if (note.workers && note.workers.length > 0) {
        doc.fontSize(10).fillColor('#64748b').text('TRABAJADORES');
        note.workers.forEach((w) => {
          doc.fontSize(11).fillColor('#1e293b').text(`• ${w.name}: ${w.hours}h`);
        });
      } else if (note.hours) {
        doc.fontSize(11).fillColor('#1e293b').text(`Horas: ${note.hours}h`);
      }
    } else {
      doc.fontSize(11).fillColor('#1e293b')
        .text(`Material: ${note.material ?? ''}`)
        .text(`Cantidad: ${note.quantity ?? ''} ${note.unit ?? ''}`);
    }

    doc.moveDown(1.5);

    // ── Firma ─────────────────────────────────────────────────────────────────
    if (note.signed) {
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').stroke();
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#64748b').text('FIRMA');
      const signedAt = note.signedAt
        ? new Date(note.signedAt).toLocaleString('es-ES')
        : '';
      doc.fontSize(11).fillColor('#1e293b').text(`Firmado el: ${signedAt}`);

      if (data.signatureImageUrl) {
        try {
          doc.image(data.signatureImageUrl, { width: 150 });
        } catch {
          // si la URL remota no es accesible, omitir imagen
        }
      }
    }

    doc.end();
  });
}
