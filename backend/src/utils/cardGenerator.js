const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');
const QRCode = require('qrcode');

const MM = 72 / 25.4;
const W = 85.60 * MM;
const H = 53.98 * MM;
const mm = (v) => v * MM;

// Colors
const DARK = '#0f2244';
const MID = '#1a3366';
const LIGHT_BG = '#f0f4f8';
const ACCENT = '#c8a415';
const WHITE = '#ffffff';
const GRAY = '#5a6577';

const assetsDir = path.join(__dirname, '../../uploads/assets');

function getLogoPath() {
  const jpeg = path.join(assetsDir, 'logo.jpeg');
  const png = path.join(assetsDir, 'logo.png');
  if (fs.existsSync(jpeg)) return jpeg;
  if (fs.existsSync(png)) return png;
  return null;
}

function drawFront(doc, membro, logoPath) {
  // Background
  doc.rect(0, 0, W, H).fill(LIGHT_BG);

  // Dark blue header bar
  const headerH = mm(18);
  doc.rect(0, 0, W, headerH).fill(DARK);

  // Logo circle in header
  if (logoPath) {
    try {
      doc.save();
      const logoSize = mm(12);
      const lx = mm(4);
      const ly = mm(3);
      doc.circle(lx + logoSize / 2, ly + logoSize / 2, logoSize / 2 + 1).fill(WHITE);
      doc.image(logoPath, lx, ly, { width: logoSize, height: logoSize });
      doc.restore();
    } catch (e) {}
  }

  // SF-DGCI badge
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(5);
  doc.text('SF-DGCI', mm(2.5), mm(15.5), { width: mm(15), align: 'center' });

  // Title text
  const titleX = mm(20);
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(7);
  doc.text('SINDICATO DOS FUNCIONÁRIOS', titleX, mm(2.5), { width: W - titleX - mm(16) });
  doc.text('DA DIREÇÃO-GERAL', titleX, mm(6), { width: W - titleX - mm(16) });
  doc.fillColor('#a0b4d0').fontSize(6.5);
  doc.text('DAS CONTRIBUIÇÕES E IMPOSTOS', titleX, mm(9.5), { width: W - titleX - mm(16) });

  // CARTÃO DE MEMBRO badge
  doc.roundedRect(titleX, mm(13.5), mm(30), mm(4), 2).fill(WHITE);
  doc.fillColor(DARK).font('Helvetica-Bold').fontSize(5.5);
  doc.text('CARTÃO DE MEMBRO', titleX + mm(1), mm(14.3), { width: mm(28), align: 'center' });

  // Right vertical strip  
  const stripW = mm(8);
  const stripX = W - stripW;
  doc.rect(stripX, headerH, stripW, H - headerH).fill(DARK);

  // Vertical text "UNIÃO • FORÇA • DIGNIDADE"
  doc.save();
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(5);
  doc.translate(stripX + stripW / 2 + 1.5, H - mm(3));
  doc.rotate(-90);
  doc.text('UNIÃO  •  FORÇA  •  DIGNIDADE', 0, 0, { width: H - headerH - mm(6) });
  doc.restore();

  // Photo area
  const photoX = mm(4);
  const photoY = mm(21);
  const photoW = mm(22);
  const photoH = mm(22);

  doc.roundedRect(photoX - 1, photoY - 1, photoW + 2, photoH + 2, 4).lineWidth(0.5).strokeColor('#d0d8e8').stroke();
  doc.roundedRect(photoX, photoY, photoW, photoH, 3).fill(WHITE);

  if (membro.foto_url) {
    try {
      const photoPath = path.join(__dirname, '../../', membro.foto_url.replace(/^\//, ''));
      if (fs.existsSync(photoPath)) {
        doc.image(photoPath, photoX + 1, photoY + 1, {
          fit: [photoW - 2, photoH - 2], align: 'center', valign: 'center'
        });
      }
    } catch (e) {}
  } else {
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(20);
    doc.text((membro.nome_completo || 'M').charAt(0), photoX + photoW / 2 - 7, photoY + photoH / 2 - 10);
  }

  // Member info fields
  const infoX = mm(29);
  const infoW = stripX - infoX - mm(2);
  let y = mm(20);
  const lineH = mm(5.2);

  const fields = [
    { label: 'NOME:', value: membro.nome_completo || '-' },
    { label: 'FUNÇÃO:', value: membro.cargo_nome || membro.funcao_cargo || '-' },
    { label: 'SERVIÇO:', value: membro.departamento_nome || '-' },
    { label: 'FUNDO SOCIAL:', value: membro.fundo_social ? 'SIM' : 'NÃO' },
    { label: 'DATA DE ADMISSÃO:', value: membro.data_admissao ? new Date(membro.data_admissao).toLocaleDateString('pt-PT') : '-' },
    { label: 'VALIDADE:', value: membro.data_admissao ? new Date(new Date(membro.data_admissao).setFullYear(new Date(membro.data_admissao).getFullYear() + 1)).toLocaleDateString('pt-PT') : '-' }
  ];

  fields.forEach(({ label, value }) => {
    // Small icon dot
    doc.circle(infoX + mm(0.5), y + 2.5, 1.5).fill(DARK);
    // Label
    doc.fillColor(DARK).font('Helvetica-Bold').fontSize(5);
    doc.text(label, infoX + mm(2), y, { width: mm(18), continued: false });
    // Value
    doc.fillColor('#333').font('Helvetica').fontSize(5.5);
    doc.text(value, infoX + mm(20), y, { width: infoW - mm(21) });
    y += lineH;
  });

  // Number box at bottom-left
  const numBoxY = mm(44);
  const numBoxW = mm(25);
  const numBoxH = mm(7.5);
  doc.roundedRect(photoX, numBoxY, numBoxW, numBoxH, 3).fill(DARK);
  doc.fillColor('#90a8cc').font('Helvetica-Bold').fontSize(4.5);
  doc.text('Nº DE CARTÃO', photoX + mm(1.5), numBoxY + mm(1));
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(5.5);
  doc.text(membro.numero_membro || '-', photoX + mm(1.5), numBoxY + mm(4));

  // Signature line
  const sigX = infoX;
  const sigY = mm(47);
  doc.moveTo(sigX, sigY).lineTo(sigX + mm(36), sigY).lineWidth(0.3).strokeColor('#999').stroke();
  doc.fillColor(GRAY).font('Helvetica').fontSize(4.5);
  doc.text('ASSINATURA DO PORTADOR', sigX, sigY + mm(1.5), { width: mm(36), align: 'center' });
}

async function drawBack(doc, membro, logoPath) {
  doc.addPage({ size: [W, H], margin: 0 });

  // Background
  doc.rect(0, 0, W, H).fill(LIGHT_BG);

  // Watermark logo
  if (logoPath) {
    try {
      const wmSize = mm(30);
      doc.opacity(0.05);
      doc.image(logoPath, W - wmSize - mm(5), (H - wmSize) / 2, { width: wmSize });
      doc.opacity(1);
    } catch (e) { doc.opacity(1); }
  }

  // Left dark panel
  const lpW = mm(32);
  const lpM = mm(4);
  doc.roundedRect(lpM, lpM, lpW, H - lpM * 2, 6).fill(DARK);

  // "O TITULAR DESTE CARTÃO" section
  doc.fillColor('#90a8cc').font('Helvetica-Bold').fontSize(5.5);
  doc.text('O TITULAR DESTE CARTÃO', lpM + mm(2), lpM + mm(3), { width: lpW - mm(4) });

  doc.fillColor(WHITE).font('Helvetica').fontSize(4.8);
  doc.text(
    'é membro efetivo do Sindicato dos Funcionários da Direção-Geral das Contribuições e Impostos, estando em pleno gozo dos seus direitos e deveres estatutários.',
    lpM + mm(2), lpM + mm(9), { width: lpW - mm(4), lineGap: 1.5 }
  );

  // QR Code
  const qrData = `SF-DGCI | ${membro.numero_membro}\n${membro.nome_completo}\n${membro.departamento_nome || ''}`;
  const qrImg = await QRCode.toDataURL(qrData, { margin: 1, width: 120, color: { dark: '#1a2f5e', light: '#ffffff' } });
  const qrSize = mm(12);
  doc.image(qrImg, lpM + (lpW - qrSize) / 2, lpM + mm(24), { width: qrSize });

  // Signature line on dark panel
  const bsigY = H - lpM - mm(10);
  doc.moveTo(lpM + mm(4), bsigY).lineTo(lpM + lpW - mm(4), bsigY).lineWidth(0.3).strokeColor('#5580aa').stroke();
  doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(5);
  doc.text('Presidente do Sindicato', lpM, bsigY + mm(2), { width: lpW, align: 'center' });

  // Right section
  const rpX = lpM + lpW + mm(3);
  const rpW = W - rpX - mm(4);

  // MISSÃO DO SINDICATO
  doc.fillColor(DARK).font('Helvetica-Bold').fontSize(6);
  doc.text('MISSÃO DO SINDICATO', rpX, mm(5), { width: rpW, underline: true });

  doc.fillColor(GRAY).font('Helvetica').fontSize(4.5);
  doc.text(
    'Defender os direitos, promover o bem-estar e valorizar os funcionários da DGCI, contribuindo para uma administração fiscal mais justa, eficiente e transparente.',
    rpX, mm(11), { width: rpW, lineGap: 1.2 }
  );

  // Contact info
  const cY = mm(28);
  const cGap = mm(5);
  doc.fillColor(DARK).font('Helvetica-Bold').fontSize(4.5);

  // Address
  doc.fillColor('#cc3333').font('Helvetica-Bold').fontSize(5).text('●', rpX, cY);
  doc.fillColor(GRAY).font('Helvetica').fontSize(4.3);
  doc.text('Sede: Av. Combatentes da Liberdade da Pátria, Nº 1998, CP 1449, Bissau – Guiné-Bissau',
    rpX + mm(3), cY, { width: rpW - mm(4), lineGap: 1 });

  // Phone
  doc.fillColor('#2266aa').font('Helvetica-Bold').fontSize(5).text('●', rpX, cY + cGap + mm(2));
  doc.fillColor(GRAY).font('Helvetica').fontSize(4.3);
  doc.text('+245 95 123 45 67', rpX + mm(3), cY + cGap + mm(2), { width: rpW - mm(4) });

  // Email
  doc.fillColor('#2266aa').font('Helvetica-Bold').fontSize(5).text('●', rpX, cY + cGap * 2 + mm(2));
  doc.fillColor(GRAY).font('Helvetica').fontSize(4.3);
  doc.text('sindicatodgci@gmail.com', rpX + mm(3), cY + cGap * 2 + mm(2), { width: rpW - mm(4) });

  // Website
  doc.fillColor('#2266aa').font('Helvetica-Bold').fontSize(5).text('●', rpX, cY + cGap * 3 + mm(2));
  doc.fillColor(GRAY).font('Helvetica').fontSize(4.3);
  doc.text('www.sindicatodgci.gw', rpX + mm(3), cY + cGap * 3 + mm(2), { width: rpW - mm(4) });
}

async function generateCard(membro, res) {
  const doc = new PDFDocument({ size: [W, H], margin: 0 });
  doc.pipe(res);

  const logoPath = getLogoPath();

  drawFront(doc, membro, logoPath);
  await drawBack(doc, membro, logoPath);

  doc.end();
}

module.exports = { generateCard };
