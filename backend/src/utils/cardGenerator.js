const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const MM = 72 / 25.4;
const W = 85.60 * MM;
const H = 53.98 * MM;
const mm = (v) => v * MM;

// Premium Colors - Institutional Style
const DARK_NAVY = '#003B8E';      // Azul oficial DGCI
const HEADER_BG = '#002A69';      // Azul mais escuro para áreas premium
const ACCENT_GOLD = '#ffffff';    // Texto branco de destaque
const WHITE = '#ffffff';
const TEXT_DARK = '#062752';      // Texto azul escuro forte
const TEXT_LABEL = '#003B8E';     // Labels em azul DGCI
const TEXT_LIGHT = '#6b7280';     // Texto cinza claro
const BG_LIGHT = '#f7faff';       // Fundo branco frio elegante
const BORDER_LIGHT = '#cfd9ee';   // Bordas suaves
const ACCENT_BLUE = '#1748b8';    // Azul complementar mais vivo

const assetsDir = path.join(__dirname, '../../uploads/assets');

function getLogoPath() {
  const jpeg = path.join(assetsDir, 'logo.jpeg');
  const png = path.join(assetsDir, 'logo.png');
  if (fs.existsSync(jpeg)) return jpeg;
  if (fs.existsSync(png)) return png;
  return null;
}

async function drawFront(doc, membro, logoPath) {
  // ═══════════════════════════════════════════════════════════════════
  // BACKGROUND & OVERALL DESIGN
  // ═══════════════════════════════════════════════════════════════════

  doc.rect(0, 0, W, H).fill(BG_LIGHT);

  doc.strokeColor(BORDER_LIGHT).lineWidth(0.2);
  for (let i = 0; i < 12; i++) {
    doc.moveTo(i * (W / 12), 0).lineTo(i * (W / 12) + H, H).stroke();
  }
  doc.strokeColor(BORDER_LIGHT).lineWidth(0.1);

  if (logoPath) {
    try {
      const wmSize = mm(44);
      doc.opacity(0.08);
      doc.image(logoPath, W / 2 - wmSize / 2, H / 2 - wmSize / 2, { width: wmSize });
      doc.opacity(1);
    } catch (e) { doc.opacity(1); }
  }

  const leftX = mm(3);
  const leftW = mm(27);
  const leftY = mm(16);
  const leftH = H - mm(32);
  const rightW = mm(13.5);
  const rightX = W - rightW - mm(3);
  const centerX = leftX + leftW + mm(2);
  const centerW = rightX - centerX - mm(2);
  const photoY = leftY + mm(2);
  const photoH = mm(27);

  doc.roundedRect(leftX, leftY, leftW, leftH, 12).fill(WHITE).strokeColor(BORDER_LIGHT).lineWidth(0.3).stroke();
  doc.roundedRect(centerX, leftY, centerW, leftH, 12).fill(WHITE).strokeColor(BORDER_LIGHT).lineWidth(0.3).stroke();
  doc.roundedRect(rightX, leftY, rightW, leftH, 12).fill(DARK_NAVY);

  const photoX = leftX + mm(1.4);
  const photoW = leftW - mm(2.8);
  doc.roundedRect(photoX, photoY, photoW, photoH, 10).fill(BG_LIGHT).strokeColor('#c8d8f2').lineWidth(0.75).stroke();

  if (membro.foto_url) {
    try {
      const photoPath = path.join(__dirname, '../../', membro.foto_url.replace(/^\//, ''));
      if (fs.existsSync(photoPath)) {
        doc.image(photoPath, photoX + 0.8, photoY + 0.8, {
          fit: [photoW - 1.6, photoH - 1.6], align: 'center', valign: 'center'
        });
      }
    } catch (e) { }
  } else {
    doc.fillColor(DARK_NAVY).font('Helvetica-Bold').fontSize(24);
    doc.text((membro.nome_completo || 'M').charAt(0), photoX + photoW / 2 - 8.5, photoY + photoH / 2 - 12);
  }

  const numberY = photoY + photoH + mm(4);
  doc.roundedRect(photoX, numberY, photoW, mm(9), 8).fill(DARK_NAVY);
  doc.fillColor(ACCENT_GOLD).font('Helvetica-Bold').fontSize(4.8);
  doc.text('Nº DE CARTÃO', photoX + mm(1.2), numberY + mm(1.3), { width: photoW - mm(2.4), align: 'left' });
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(7.0);
  doc.text(membro.numero_membro || '-', photoX + mm(1.2), numberY + mm(5.2), { width: photoW - mm(2.4), align: 'left' });

  const headingY = leftY + mm(3.5);
  const logoCircleSize = mm(13);
  const logoCircleX = centerX + mm(2);
  const logoCircleY = headingY;
  doc.circle(logoCircleX + logoCircleSize / 2, logoCircleY + logoCircleSize / 2, logoCircleSize / 2).fill(WHITE).strokeColor(DARK_NAVY).lineWidth(0.8).stroke();
  if (logoPath) {
    try {
      doc.image(logoPath, logoCircleX + mm(1.2), logoCircleY + mm(1.2), { width: logoCircleSize - mm(2.4) });
    } catch (e) { }
  }

  const titleX = logoCircleX + logoCircleSize + mm(3);
  doc.fillColor(DARK_NAVY).font('Helvetica-Bold').fontSize(6.2);
  doc.text('SINDICATO DOS FUNCIONÁRIOS DA', titleX, headingY, { width: centerW - mm(10), align: 'left', lineGap: 0.5 });
  doc.text('DIREÇÃO-GERAL DAS CONTRIBUIÇÕES E IMPOSTOS', { width: centerW - mm(10), align: 'left' });

  const badgeY = headingY + mm(17);
  doc.roundedRect(centerX + mm(2), badgeY, mm(28), mm(6), 4).fill(DARK_NAVY);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(5.2);
  doc.text('CARTÃO DE MEMBRO', centerX + mm(2), badgeY + mm(1.2), { width: mm(28), align: 'center' });

  const infoStartY = badgeY + mm(10);
  const infoGap = mm(6.2);
  const profession = membro.profissao || membro.cargo_nome || membro.funcao_cargo || '—';
  const role = membro.funcao_cargo || membro.cargo_nome || '—';
  const service = membro.departamento_nome || '—';
  const admission = membro.data_admissao ? new Date(membro.data_admissao).toLocaleDateString('pt-PT') : '-';
  const validity = membro.data_admissao ? new Date(new Date(membro.data_admissao).setFullYear(new Date(membro.data_admissao).getFullYear() + 1)).toLocaleDateString('pt-PT') : '-';

  const details = [
    { label: 'Nome', value: membro.nome_completo || '-' },
    { label: 'Profissão', value: profession },
    { label: 'Função', value: role },
    { label: 'Serviço', value: service },
    { label: 'Data de Admissão', value: admission },
    { label: 'Validade', value: validity }
  ];

  details.forEach((item, idx) => {
    const y = infoStartY + idx * infoGap;
    doc.fillColor(TEXT_LABEL).font('Helvetica-Bold').fontSize(4.8);
    doc.text(`${item.label}:`, centerX + mm(2), y, { width: mm(22) });
    doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(5.8);
    doc.text(item.value, centerX + mm(2), y + mm(3.5), { width: centerW - mm(4), align: 'left' });
  });

  const signatureY = leftY + leftH - mm(9.5);
  doc.save();
  doc.strokeColor(BORDER_LIGHT).lineWidth(0.35).dash(1, { space: 1 });
  doc.moveTo(centerX + mm(2), signatureY).lineTo(rightX - mm(1), signatureY).stroke();
  doc.undash();
  doc.restore();
  doc.fillColor(TEXT_LIGHT).font('Helvetica').fontSize(4.6);
  doc.text('ASSINATURA DO PORTADOR', centerX + mm(2), signatureY + mm(1.3), { width: centerW - mm(4), align: 'center' });

  const qrSize = mm(13.5);
  const qrX = rightX + (rightW - qrSize) / 2;
  const qrY = leftY + leftH - qrSize - mm(11);
  const profileUrl = `https://www.sfdgci.co.mz/membro/${encodeURIComponent(membro.numero_membro || '')}`;
  const qrImg = await QRCode.toDataURL(profileUrl, {
    margin: 1,
    width: 180,
    color: { dark: DARK_NAVY, light: WHITE }
  });

  doc.roundedRect(qrX - mm(0.8), qrY - mm(0.8), qrSize + mm(1.6), qrSize + mm(1.6), 4).fill(WHITE);
  doc.image(qrImg, qrX, qrY, { width: qrSize });

  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(4.4);
  doc.text('VALIDAR CARTÃO', rightX, qrY + qrSize + mm(3), { width: rightW, align: 'center' });
  doc.font('Helvetica').fontSize(3.6).fillColor(WHITE);
  doc.text(profileUrl, rightX, qrY + qrSize + mm(6), { width: rightW, align: 'center' });

  const mottoX = rightX + rightW - mm(1);
  const mottoY = leftY + mm(14);
  doc.save();
  doc.rotate(-90, { origin: [mottoX, leftY + leftH / 2] });
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(4.6);
  doc.text('UNIÃO • FORÇA • DIGNIDADE', - (leftY + leftH / 2) + mm(2), mottoX - mm(8), {
    width: leftH - mm(16),
    align: 'center',
    lineGap: 2
  });
  doc.restore();
}

async function drawBack(doc, membro, logoPath) {
  doc.addPage({ size: [W, H], margin: 0 });

  doc.rect(0, 0, W, H).fill(BG_LIGHT);

  if (logoPath) {
    try {
      const watermarkSize = mm(44);
      doc.opacity(0.08);
      doc.image(logoPath, W / 2 - watermarkSize / 2, H / 2 - watermarkSize / 2, { width: watermarkSize });
      doc.opacity(1);
    } catch (e) {
      doc.opacity(1);
    }
  }

  const leftW = mm(31.5);
  const margin = mm(4);
  const innerHeight = H - margin * 2;

  doc.roundedRect(margin, margin, leftW, innerHeight, 12).fill(DARK_NAVY);
  doc.rect(margin + leftW - mm(0.6), margin, mm(0.6), innerHeight).fill(ACCENT_BLUE);

  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(5.4);
  doc.text('O TITULAR DESTE CARTÃO', margin + mm(3), margin + mm(4), { width: leftW - mm(6) });

  doc.fillColor(WHITE).font('Helvetica').fontSize(4.8);
  doc.text(
    'É membro efetivo do Sindicato dos Funcionários da Direção-Geral das Contribuições e Impostos, estando em pleno gozo dos seus direitos e deveres estatutários.',
    margin + mm(3), margin + mm(12), { width: leftW - mm(6), lineGap: 1.4 }
  );

  const signatureY = margin + innerHeight - mm(12.5);
  doc.strokeColor(WHITE).lineWidth(0.35);
  doc.moveTo(margin + mm(3), signatureY).lineTo(margin + leftW - mm(3), signatureY).stroke();
  doc.fillColor(WHITE).font('Helvetica').fontSize(4.6);
  doc.text('Presidente do Sindicato', margin, signatureY + mm(1.7), { width: leftW, align: 'center' });

  const rightX = margin + leftW + mm(2);
  const rightW = W - rightX - margin;

  doc.roundedRect(rightX, margin, rightW, innerHeight, 12).fill(WHITE).strokeColor(BORDER_LIGHT).lineWidth(0.3).stroke();

  if (logoPath) {
    try {
      const logoSize = mm(16);
      doc.image(logoPath, rightX + rightW / 2 - logoSize / 2, margin + mm(3.5), { width: logoSize });
    } catch (e) { }
  }

  doc.fillColor(DARK_NAVY).font('Helvetica-Bold').fontSize(6.8);
  doc.text('MISSÃO DO SINDICATO', rightX + mm(4), margin + mm(24), { width: rightW - mm(8), align: 'left' });

  doc.strokeColor(ACCENT_BLUE).lineWidth(0.4);
  doc.moveTo(rightX + mm(4), margin + mm(30), rightX + rightW - mm(4), margin + mm(30)).stroke();

  doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(4.8);
  doc.text(
    'Defender os direitos, promover o bem-estar e valorizar os funcionários da DGCI, contribuindo para uma administração fiscal mais justa, eficiente e transparente.',
    rightX + mm(4), margin + mm(34), { width: rightW - mm(8), lineGap: 1.4 }
  );

  const contactY = margin + mm(52);
  const contactItems = [
    { label: 'Sede', value: 'Av. Combatentes da Liberdade da Pátria, Nº 1998, CP 1449, Bissau – Guiné-Bissau' },
    { label: 'Telefone', value: '+245 95 123 45 67' },
    { label: 'Email', value: 'sindicatodgci@gmail.com' },
    { label: 'Website', value: 'www.sindicatodgci.gw' }
  ];

  let currentY = contactY;
  contactItems.forEach((item) => {
    doc.fillColor(DARK_NAVY).font('Helvetica-Bold').fontSize(4.4);
    doc.circle(rightX + mm(4.5), currentY + mm(1.4), 0.8).fill(ACCENT_BLUE);
    doc.text(`${item.label}:`, rightX + mm(6.5), currentY, { continued: true, width: mm(18) });
    doc.fillColor(TEXT_DARK).font('Helvetica').fontSize(4.4);
    doc.text(item.value, { width: rightW - mm(14), align: 'left' });
    currentY += mm(6);
  });
}

async function generateCard(membro, res) {
  const doc = new PDFDocument({ size: [W, H], margin: 0 });
  doc.pipe(res);

  const logoPath = getLogoPath();

  await drawFront(doc, membro, logoPath);
  await drawBack(doc, membro, logoPath);

  doc.end();
}

module.exports = { generateCard };
