import { HomeExercisePlanPdfPort } from '../domain/ports/HomeExercisePlanPdfPort.js';
import { getExerciseIllustration } from '../../treatment/exerciseIllustrations.js';

const BRAND_LOGO = `${import.meta.env.BASE_URL}images/logo_fisio.jpg`;

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[character];
  });
}

function dosage(exercise) {
  const parts = [];
  if (exercise.contraction) {
    parts.push(
      {
        isometrica: 'Isométrica',
        concentrica: 'Concéntrica',
        excentrica: 'Excéntrica',
      }[exercise.contraction] ?? exercise.contraction,
    );
  }
  if (exercise.sets != null) parts.push(`${exercise.sets} series`);
  if (exercise.repetitions != null) parts.push(`${exercise.repetitions} repeticiones`);
  if (exercise.durationSeconds != null) parts.push(`${exercise.durationSeconds} segundos`);
  if (exercise.restSeconds != null) parts.push(`Pausa: ${exercise.restSeconds} segundos`);
  if (exercise.frequencyPerWeek != null) {
    parts.push(`${exercise.frequencyPerWeek} veces por semana`);
  }
  return parts;
}

function phaseLabel(phase) {
  return {
    aguda: 'Aguda',
    subaguda: 'Subaguda',
    cronica: 'Crónica',
  }[phase] ?? phase;
}

function exerciseMarkup(exercise, index) {
  const dose = dosage(exercise);
  const illustration = getExerciseIllustration(exercise.illustrationKey);
  const details = illustration;
  return `
    <article class="exercise">
      <div class="exercise-heading">
        <span class="exercise-number">${String(index + 1).padStart(2, '0')}</span>
        <h3>${escapeHtml(exercise.name)}</h3>
      </div>
      ${illustration
        ? `<figure class="illustration"><img src="${escapeHtml(illustration.imagePath)}" alt="${escapeHtml(illustration.label)}"><figcaption>${escapeHtml(illustration.label)} · ilustración orientativa</figcaption></figure>`
        : ''}
      ${details
        ? `<div class="exercise-details">
            <div><span class="field-label">Posición inicial</span><p>${escapeHtml(details.startingPosition)}</p></div>
            <div><span class="field-label">Ejecución</span><p>${escapeHtml(details.execution)}</p></div>
            <div class="muscle-details">
              <div><span class="field-label">Músculos principales</span><p>${escapeHtml(details.muscles)}</p></div>
              ${details.muscleImagePath
                ? `<img src="${escapeHtml(details.muscleImagePath)}" alt="Músculos trabajados: ${escapeHtml(details.muscles)}" onerror="this.hidden=true">`
                : ''}
            </div>
            <div><span class="field-label">Recomendación</span><p>${escapeHtml(details.tip)}</p></div>
          </div>`
        : ''}
      ${dose.length
        ? `<ul class="dosage">${dose.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
        : '<p class="missing-dose">Dosificación no especificada</p>'}
      ${exercise.instructions
        ? `<div class="instructions"><span class="field-label">Indicaciones</span><p>${escapeHtml(exercise.instructions).replace(/\n/g, '<br>')}</p></div>`
        : ''}
    </article>`;
}

export class BrowserHomeExercisePlanPdfAdapter extends HomeExercisePlanPdfPort {
  generate({ patient, evaluation, exercises }) {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('El navegador bloqueó la ventana del reporte. Permite las ventanas emergentes e inténtalo de nuevo.');
    }

    const date = evaluation.createdAt
      ? new Date(evaluation.createdAt).toLocaleDateString('es-VE')
      : new Date().toLocaleDateString('es-VE');
    const generatedAt = new Date().toLocaleDateString('es-VE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    printWindow.document.open();
    printWindow.document.write(`<!doctype html>
      <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Pauta de ejercicios - ${escapeHtml(patient.fullName)}</title>
          <style>
            :root { color-scheme: light; --ink: #18313b; --muted: #61727a; --line: #dce6e8; --teal: #087e80; --pale: #edf7f6; }
            * { box-sizing: border-box; }
            body { margin: 0; background: #edf1f3; color: var(--ink); font: 14px/1.55 Inter, "Segoe UI", Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            main { max-width: 860px; min-height: 100vh; margin: 28px auto; padding: 38px 46px; background: #fff; box-shadow: 0 12px 40px #17313b18; }
            .topline { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding-bottom: 20px; border-bottom: 2px solid var(--line); }
            .brand { display: flex; min-width: 0; align-items: center; }
            .brand-logo { display: block; width: min(100%, 310px); height: auto; max-height: 112px; object-fit: contain; object-position: left center; }
            .document-tag { padding: 8px 12px; border: 1px solid #b8ddda; border-radius: 999px; background: var(--pale); color: #08686a; font-size: 10px; font-weight: 750; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }
            .hero { position: relative; margin: 24px 0 20px; padding: 25px 28px; overflow: hidden; border-radius: 14px; background: linear-gradient(115deg, #edf7f6 0%, #f8fbfb 74%, #e1f1ef 100%); }
            .hero:after { position: absolute; right: -42px; bottom: -84px; width: 200px; height: 200px; border: 22px solid #087e8010; border-radius: 50%; content: ""; }
            .eyebrow { margin: 0 0 7px; color: var(--teal); font-size: 11px; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
            h1 { margin: 0; color: var(--ink); font-size: 30px; line-height: 1.2; letter-spacing: -.035em; }
            .subtitle { margin: 9px 0 0; color: var(--muted); font-size: 13px; }
            .patient-card { display: grid; grid-template-columns: 1.35fr 1fr 1fr; gap: 16px 22px; padding: 20px; border: 1px solid var(--line); border-radius: 12px; background: #fbfdfd; box-shadow: 0 4px 14px #17313b08; }
            .patient-main { grid-column: 1 / -1; padding-bottom: 14px; border-bottom: 1px solid var(--line); }
            .field-label { display: block; margin-bottom: 4px; color: var(--muted); font-size: 10px; font-weight: 750; letter-spacing: .07em; text-transform: uppercase; }
            .patient-name { margin: 0; color: var(--ink); font-size: 19px; font-weight: 700; }
            .field-value { margin: 0; color: var(--ink); font-size: 13px; font-weight: 600; overflow-wrap: anywhere; }
            .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 12px; margin: 30px 0 13px; padding-bottom: 9px; border-bottom: 1px solid var(--line); }
            .section-heading h2 { margin: 0; color: var(--ink); font-size: 17px; letter-spacing: -.015em; }
            .section-heading p { margin: 0; color: var(--muted); font-size: 11px; }
            .exercise-list { display: grid; gap: 15px; }
            .exercise { padding: 18px 20px; border: 1px solid var(--line); border-radius: 13px; background: linear-gradient(145deg, #fff 68%, #f8fbfb); box-shadow: 0 4px 14px #17313b08; break-inside: avoid; page-break-inside: avoid; }
            .exercise-heading { display: flex; align-items: center; gap: 11px; }
            .exercise-number { display: grid; width: 31px; height: 31px; flex: 0 0 31px; place-items: center; border-radius: 9px; background: var(--pale); color: var(--teal); font-size: 11px; font-weight: 800; }
            .exercise h3 { margin: 0; color: var(--ink); font-size: 15px; font-weight: 700; }
            .illustration { margin: 14px 0 0 42px; padding: 10px; border: 1px solid #e8eff0; border-radius: 10px; background: #fff; }
            .illustration img { display: block; width: 100%; max-width: 460px; max-height: 270px; object-fit: contain; object-position: left center; }
            .illustration figcaption { margin-top: 4px; color: var(--muted); font-size: 10px; }
            .exercise-details { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 18px; margin: 14px 0 0 42px; }
            .exercise-details p { margin: 0; color: #405760; font-size: 12px; overflow-wrap: anywhere; }
            .muscle-details { display: grid; grid-template-columns: 1fr minmax(90px, 145px); align-items: center; gap: 8px; }
            .muscle-details img { display: block; width: 100%; max-width: 145px; max-height: 130px; object-fit: contain; }
            .dosage { display: flex; flex-wrap: wrap; gap: 7px; margin: 13px 0 0 42px; padding: 0; list-style: none; }
            .dosage li { padding: 5px 9px; border-radius: 6px; background: #f1f6f7; color: #294c55; font-size: 11px; font-weight: 650; }
            .missing-dose { margin: 10px 0 0 42px; color: #9a5c12; font-size: 11px; }
            .instructions { margin: 13px 0 0 42px; padding-top: 11px; border-top: 1px solid #edf1f2; }
            .instructions p { margin: 0; color: #405760; font-size: 12px; overflow-wrap: anywhere; }
            .note { display: flex; gap: 12px; margin-top: 24px; padding: 15px 17px; border-left: 3px solid var(--teal); border-radius: 5px 9px 9px 5px; background: var(--pale); color: #34565c; font-size: 12px; }
            .note strong { display: block; margin-bottom: 2px; color: #15565a; }
            .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin: 38px 0 28px; }
            .signature { padding-top: 9px; border-top: 1px solid #84969b; color: var(--muted); font-size: 10px; }
            footer { display: flex; justify-content: space-between; gap: 12px; padding-top: 12px; border-top: 1px solid var(--line); color: #7b8b90; font-size: 10px; }
            .print-button { display: block; margin: 0 auto 24px; padding: 11px 20px; border: 0; border-radius: 8px; background: #087e80; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
            @page { size: A4; margin: 15mm; }
            @media (max-width: 640px) {
              main { margin: 0; padding: 20px 16px; }
              .brand-logo { width: min(100%, 230px); max-height: 82px; }
              .patient-card { grid-template-columns: 1fr 1fr; gap: 14px; }
              .patient-main { grid-column: 1 / -1; }
              .hero { margin: 20px 0 16px; padding: 20px; }
              h1 { font-size: 25px; }
              .document-tag { font-size: 9px; }
              .exercise-details { grid-template-columns: 1fr; }
            }
            @media print {
              body { background: #fff; font-size: 12px; }
              main { max-width: none; min-height: 0; margin: 0; padding: 0; box-shadow: none; }
              .print-button { display: none; }
              .hero, .patient-card, .exercise, .note { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .hero { padding-top: 21px; }
              .patient-card, .exercise, .note { break-inside: avoid; page-break-inside: avoid; }
              .exercise-list { gap: 10px; }
              .exercise { padding: 14px 16px; }
              .illustration img { max-height: 220px; }
              footer { margin-top: 20px; }
            }
          </style>
        </head>
        <body>
          <button class="print-button" type="button" onclick="window.print()">Imprimir o guardar como PDF</button>
          <main>
            <header class="topline">
              <div class="brand">
                <img class="brand-logo" src="${escapeHtml(BRAND_LOGO)}" alt="Milángela Duarte, fisioterapeuta">
              </div>
              <span class="document-tag">Pauta del paciente</span>
            </header>
            <section class="hero">
              <p class="eyebrow">Guía de ejercicios</p>
              <h1>Tu plan de ejercicios</h1>
              <p class="subtitle">Sigue la dosificación y las indicaciones acordadas con tu profesional.</p>
            </section>
            <section class="patient-card" aria-label="Datos de la pauta">
              <div class="patient-main">
                <span class="field-label">Paciente</span>
                <p class="patient-name">${escapeHtml(patient.fullName)}</p>
              </div>
              <div>
                <span class="field-label">Fecha de evaluación</span>
                <p class="field-value">${escapeHtml(date)}</p>
              </div>
              <div>
                <span class="field-label">Zona</span>
                <p class="field-value">${escapeHtml(evaluation.zone)}</p>
              </div>
              <div>
                <span class="field-label">Diagnóstico</span>
                <p class="field-value">${escapeHtml(evaluation.diagnosis)}</p>
              </div>
              <div>
                <span class="field-label">Fase registrada</span>
                <p class="field-value">${escapeHtml(phaseLabel(evaluation.phase))}</p>
              </div>
            </section>
            <section>
              <div class="section-heading">
                <h2>Ejercicios prescritos</h2>
                <p>${exercises.length} ${exercises.length === 1 ? 'ejercicio' : 'ejercicios'}</p>
              </div>
              <div class="exercise-list">${exercises.map(exerciseMarkup).join('')}</div>
            </section>
            <aside class="note">
              <div>
                <strong>Importante</strong>
                Realiza los ejercicios de acuerdo con estas indicaciones. Si tienes dudas sobre cómo
                ejecutarlos o necesitas modificar la pauta, consulta con tu profesional. Las
                ilustraciones son orientativas y no sustituyen las instrucciones profesionales.
              </div>
            </aside>
            <section class="signatures" aria-label="Firmas">
              <div class="signature">Profesional tratante</div>
              <div class="signature">Firma del paciente</div>
            </section>
            <footer>
              <span>Documento generado el ${escapeHtml(generatedAt)}</span>
              <span>Plan de ejercicios domiciliarios</span>
            </footer>
          </main>
        </body>
      </html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.setTimeout(() => printWindow.print(), 250);
    return true;
  }
}
