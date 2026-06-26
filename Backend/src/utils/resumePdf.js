import PDFDocument from 'pdfkit';
import { drawContactLine, drawProjectHeader } from './pdfLinkRenderer.js';

function addSectionHeader(doc, title, x, y, color) {
  doc.fontSize(12).font('Helvetica-Bold').fillColor(color)
     .text(title, x, y);

  const titleWidth = doc.widthOfString(title);
  doc.strokeColor(color).lineWidth(1)
     .moveTo(x, y + 15)
     .lineTo(x + titleWidth, y + 15)
     .stroke();

  return y + 25;
}



// Builds the PDF entirely in memory and resolves with a Buffer.
// Avoids any filesystem writes so this works on serverless runtimes.
export async function createATSFriendlyPDF(resumeData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 }
      });

      const chunks = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (error) => reject(error));

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const leftColumnWidth = pageWidth * 0.35;
      const rightColumnWidth = pageWidth * 0.62;
      const columnGap = pageWidth * 0.03;

      let leftY = doc.page.margins.top;
      let rightY = doc.page.margins.top;

      const primaryColor = '#2563eb';
      const textColor = '#1f2937';
      const lightGray = '#6b7280';

      if (resumeData.name) {
        doc.fontSize(20).font('Helvetica-Bold').fillColor(textColor)
           .text(resumeData.name, doc.page.margins.left, leftY, {
             width: pageWidth,
             align: 'left',
             ellipsis: false,
             break: true
           });
        leftY += doc.heightOfString(resumeData.name, { width: pageWidth }) + 8;
        rightY = leftY;
      }

      if (resumeData.title) {
        doc.fontSize(14).font('Helvetica').fillColor(primaryColor)
           .text(resumeData.title, doc.page.margins.left, leftY, {
             width: pageWidth,
             align: 'left',
             ellipsis: false,
             break: true
           });
        leftY += doc.heightOfString(resumeData.title, { width: pageWidth }) + 8;
        rightY = leftY;
      }

      const contactHeight = drawContactLine(doc, resumeData.contact, {
        x: doc.page.margins.left,
        y: leftY,
        width: pageWidth,
        linkColor: primaryColor,
        plainColor: lightGray,
      });

      if (contactHeight > 0) {
        leftY += contactHeight + 5;
        rightY = leftY;
      }

      doc.strokeColor('#e5e7eb').lineWidth(1)
         .moveTo(doc.page.margins.left, leftY)
         .lineTo(doc.page.width - doc.page.margins.right, leftY)
         .stroke();
      leftY += 15;
      rightY += 15;

      const leftColumnX = doc.page.margins.left;
      const bottomLimit = doc.page.height - doc.page.margins.bottom;

      function ensureSpaceForLeftColumn(neededHeight) {
        if (leftY + neededHeight > bottomLimit) {
          doc.addPage();
          leftY = doc.page.margins.top;
          rightY = doc.page.margins.top;
        }
      }

      function ensureSpaceForRightColumn(neededHeight) {
        if (rightY + neededHeight > bottomLimit) {
          doc.addPage();
          rightY = doc.page.margins.top;
          leftY = doc.page.margins.top;
        }
      }

      if (resumeData.summary) {
        doc.fontSize(10).font('Helvetica');
        const summaryHeight = 25 + doc.heightOfString(resumeData.summary, { width: leftColumnWidth, lineGap: 3 }) + 20;
        ensureSpaceForLeftColumn(summaryHeight);

        leftY = addSectionHeader(doc, 'SUMMARY', leftColumnX, leftY, primaryColor);
        doc.fontSize(10).font('Helvetica').fillColor(textColor)
           .text(resumeData.summary, leftColumnX, leftY, {
             width: leftColumnWidth,
             align: 'left',
             lineGap: 3,
             ellipsis: false,
             break: true
           });
        leftY += doc.heightOfString(resumeData.summary, { width: leftColumnWidth, lineGap: 3 }) + 20;
      }

      if (resumeData.skills.length > 0) {
        const skillsText = resumeData.skills.join(' • ');
        doc.fontSize(10).font('Helvetica');
        const skillsHeight = 25 + doc.heightOfString(skillsText, { width: leftColumnWidth, lineGap: 3 }) + 20;
        ensureSpaceForLeftColumn(skillsHeight);

        leftY = addSectionHeader(doc, 'SKILLS', leftColumnX, leftY, primaryColor);
        doc.fontSize(10).font('Helvetica').fillColor(textColor)
           .text(skillsText, leftColumnX, leftY, {
             width: leftColumnWidth,
             align: 'left',
             lineGap: 3,
             ellipsis: false,
             break: true
           });
        leftY += doc.heightOfString(skillsText, { width: leftColumnWidth, lineGap: 3 }) + 20;
      }

      if (resumeData.technologies.length > 0) {
        const techText = resumeData.technologies.join(' • ');
        doc.fontSize(10).font('Helvetica');
        const techHeight = 25 + doc.heightOfString(techText, { width: leftColumnWidth, lineGap: 3 }) + 20;
        ensureSpaceForLeftColumn(techHeight);

        leftY = addSectionHeader(doc, 'TECHNOLOGIES', leftColumnX, leftY, primaryColor);
        doc.fontSize(10).font('Helvetica').fillColor(textColor)
           .text(techText, leftColumnX, leftY, {
             width: leftColumnWidth,
             align: 'left',
             lineGap: 3,
             ellipsis: false,
             break: true
           });
        leftY += doc.heightOfString(techText, { width: leftColumnWidth, lineGap: 3 }) + 20;
      }

      if (resumeData.certifications.length > 0) {
        let initialCertHeight = 25;
        const firstCert = resumeData.certifications[0];
        doc.fontSize(10).font('Helvetica');
        initialCertHeight += doc.heightOfString(`• ${firstCert}`, { width: leftColumnWidth, lineGap: 2 }) + 8;
        ensureSpaceForLeftColumn(initialCertHeight);

        leftY = addSectionHeader(doc, 'CERTIFICATIONS', leftColumnX, leftY, primaryColor);
        resumeData.certifications.forEach(cert => {
          doc.fontSize(10).font('Helvetica');
          const certHeight = doc.heightOfString(`• ${cert}`, { width: leftColumnWidth, lineGap: 2 }) + 8;
          ensureSpaceForLeftColumn(certHeight);

          doc.fontSize(10).font('Helvetica').fillColor(textColor)
             .text(`• ${cert}`, leftColumnX, leftY, {
               width: leftColumnWidth,
               align: 'left',
               lineGap: 2,
               ellipsis: false,
               break: true
             });
          leftY += certHeight;
        });
        leftY += 15;
      }

      const rightColumnX = doc.page.margins.left + leftColumnWidth + columnGap;
      
      if (resumeData.experience.length > 0) {
        doc.fontSize(12).font('Helvetica-Bold');
        let initialHeaderHeight = 30;
        const firstExp = resumeData.experience[0];
        initialHeaderHeight += doc.heightOfString(firstExp.title, { width: rightColumnWidth }) + 5;
        
        let firstCompanyDuration = '';
        if (firstExp.company && firstExp.duration) {
          firstCompanyDuration = `${firstExp.company} | ${firstExp.duration}`;
        } else if (firstExp.company) {
          firstCompanyDuration = firstExp.company;
        } else if (firstExp.duration) {
          firstCompanyDuration = firstExp.duration;
        }
        if (firstCompanyDuration) {
          doc.fontSize(10).font('Helvetica');
          initialHeaderHeight += doc.heightOfString(firstCompanyDuration, { width: rightColumnWidth }) + 8;
        }
        if (firstExp.description && firstExp.description.length > 0) {
          const firstDesc = firstExp.description[0].trim();
          if (firstDesc) {
            doc.fontSize(10).font('Helvetica');
            initialHeaderHeight += doc.heightOfString(`• ${firstDesc}`, { width: rightColumnWidth, lineGap: 3 }) + 5;
          }
        }
        ensureSpaceForRightColumn(initialHeaderHeight);

        rightY = addSectionHeader(doc, 'EXPERIENCE', rightColumnX, rightY, primaryColor);

        resumeData.experience.forEach((exp, index) => {
          doc.fontSize(12).font('Helvetica-Bold');
          let neededHeight = doc.heightOfString(exp.title, { width: rightColumnWidth }) + 5;

          let companyDuration = '';
          if (exp.company && exp.duration) {
            companyDuration = `${exp.company} | ${exp.duration}`;
          } else if (exp.company) {
            companyDuration = exp.company;
          } else if (exp.duration) {
            companyDuration = exp.duration;
          }

          if (companyDuration) {
            doc.fontSize(10).font('Helvetica');
            neededHeight += doc.heightOfString(companyDuration, { width: rightColumnWidth }) + 8;
          }

          if (exp.description && exp.description.length > 0) {
            const firstDesc = exp.description[0].trim();
            if (firstDesc) {
              doc.fontSize(10).font('Helvetica');
              neededHeight += doc.heightOfString(`• ${firstDesc}`, { width: rightColumnWidth, lineGap: 3 }) + 5;
            }
          }

          ensureSpaceForRightColumn(neededHeight);

          doc.fontSize(12).font('Helvetica-Bold').fillColor(textColor)
             .text(exp.title, rightColumnX, rightY, {
               width: rightColumnWidth,
               align: 'left',
               ellipsis: false,
               break: true
             });
          rightY += doc.heightOfString(exp.title, { width: rightColumnWidth }) + 5;

          if (companyDuration) {
            doc.fontSize(10).font('Helvetica').fillColor(primaryColor)
               .text(companyDuration, rightColumnX, rightY, {
                 width: rightColumnWidth,
                 align: 'left',
                 ellipsis: false,
                 break: true
               });
            rightY += doc.heightOfString(companyDuration, { width: rightColumnWidth }) + 8;
          }

          if (exp.description && exp.description.length > 0) {
            exp.description.forEach(desc => {
              const cleanDesc = desc.trim();
              if (cleanDesc) {
                doc.fontSize(10).font('Helvetica');
                const bulletHeight = doc.heightOfString(`• ${cleanDesc}`, { width: rightColumnWidth, lineGap: 3 }) + 5;

                ensureSpaceForRightColumn(bulletHeight);

                doc.fontSize(10).font('Helvetica').fillColor(textColor)
                   .text(`• ${cleanDesc}`, rightColumnX, rightY, {
                     width: rightColumnWidth,
                     align: 'left',
                     lineGap: 3,
                     ellipsis: false,
                     break: true
                   });
                rightY += bulletHeight;
              }
            });
          }

          rightY += 15;
        });
      }

      if (resumeData.education.length > 0) {
        doc.fontSize(10).font('Helvetica-Bold');
        let initialEduHeight = 35;
        const firstEdu = resumeData.education[0];
        const instHeight = doc.heightOfString(firstEdu.institution || "", { width: rightColumnWidth * 0.65 });
        const locHeight = doc.heightOfString(firstEdu.location || "", { width: rightColumnWidth * 0.35 });
        initialEduHeight += Math.max(instHeight, locHeight) + 4;

        let firstDegreeText = firstEdu.degree || "";
        if (firstEdu.grade) {
          firstDegreeText += ` - ${firstEdu.grade}`;
        }
        doc.fontSize(10).font('Helvetica');
        const degHeight = doc.heightOfString(firstDegreeText, { width: rightColumnWidth * 0.65 });
        const yrHeight = doc.heightOfString(firstEdu.year || "", { width: rightColumnWidth * 0.35 });
        initialEduHeight += Math.max(degHeight, yrHeight) + 12;

        ensureSpaceForRightColumn(initialEduHeight);

        rightY = addSectionHeader(doc, 'EDUCATION', rightColumnX, rightY, primaryColor);

        resumeData.education.forEach(edu => {
          doc.fontSize(10).font('Helvetica-Bold');
          const instHeight = doc.heightOfString(edu.institution || "", { width: rightColumnWidth * 0.65 });
          const locHeight = doc.heightOfString(edu.location || "", { width: rightColumnWidth * 0.35 });

          let degreeText = edu.degree || "";
          if (edu.grade) {
            degreeText += ` - ${edu.grade}`;
          }
          doc.fontSize(10).font('Helvetica');
          const degHeight = doc.heightOfString(degreeText, { width: rightColumnWidth * 0.65 });
          const yrHeight = doc.heightOfString(edu.year || "", { width: rightColumnWidth * 0.35 });

          const neededHeight = Math.max(instHeight, locHeight) + 4 + Math.max(degHeight, yrHeight) + 12;
          ensureSpaceForRightColumn(neededHeight);

          doc.fontSize(10).font('Helvetica-Bold').fillColor(textColor)
             .text(edu.institution || "", rightColumnX, rightY, {
               width: rightColumnWidth * 0.65,
               align: 'left',
               ellipsis: false,
               break: true
             });

          doc.fontSize(10).font('Helvetica').fillColor(textColor)
             .text(edu.location || "", rightColumnX + rightColumnWidth * 0.65, rightY, {
               width: rightColumnWidth * 0.35,
               align: 'right',
               ellipsis: false,
               break: true
             });

          rightY += Math.max(instHeight, locHeight) + 4;

          doc.fontSize(10).font('Helvetica').fillColor(textColor)
             .text(degreeText, rightColumnX, rightY, {
               width: rightColumnWidth * 0.65,
               align: 'left',
               ellipsis: false,
               break: true
             });

          doc.fontSize(10).font('Helvetica-Oblique').fillColor(textColor)
             .text(edu.year || "", rightColumnX + rightColumnWidth * 0.65, rightY, {
               width: rightColumnWidth * 0.35,
               align: 'right',
               ellipsis: false,
               break: true
             });

          rightY += Math.max(degHeight, yrHeight) + 12;
        });
        rightY += 10;
      }

      if (resumeData.projects.length > 0) {
        let initialProjHeight = 30;
        const firstProj = resumeData.projects[0];
        if (firstProj.name) {
          initialProjHeight += 20;
        }
        if (firstProj.description && firstProj.description.length > 0) {
          const firstDesc = firstProj.description[0].trim();
          if (firstDesc) {
            doc.fontSize(10).font('Helvetica');
            initialProjHeight += doc.heightOfString(`• ${firstDesc}`, { width: rightColumnWidth, lineGap: 3 }) + 5;
          }
        }
        ensureSpaceForRightColumn(initialProjHeight);

        rightY = addSectionHeader(doc, 'PROJECTS', rightColumnX, rightY, primaryColor);

        resumeData.projects.forEach(project => {
          let neededHeight = 0;
          if (project.name) {
            neededHeight += 20;
          }
          if (project.description && project.description.length > 0) {
            const firstDesc = project.description[0].trim();
            if (firstDesc) {
              doc.fontSize(10).font('Helvetica');
              neededHeight += doc.heightOfString(`• ${firstDesc}`, { width: rightColumnWidth, lineGap: 3 }) + 5;
            }
          }

          ensureSpaceForRightColumn(neededHeight);

          if (project.name) {
            const headerHeight = drawProjectHeader(doc, project, {
              x: rightColumnX,
              y: rightY,
              width: rightColumnWidth,
              textColor,
              linkColor: primaryColor,
            });
            rightY += headerHeight + 8;
          }

          if (project.description && project.description.length > 0) {
            project.description.forEach(desc => {
              const cleanDesc = desc.trim();
              if (cleanDesc) {
                doc.fontSize(10).font('Helvetica');
                const bulletHeight = doc.heightOfString(`• ${cleanDesc}`, { width: rightColumnWidth, lineGap: 3 }) + 5;

                ensureSpaceForRightColumn(bulletHeight);

                doc.fontSize(10).font('Helvetica').fillColor(textColor)
                   .text(`• ${cleanDesc}`, rightColumnX, rightY, {
                     width: rightColumnWidth,
                     align: 'left',
                     lineGap: 3,
                     ellipsis: false,
                     break: true,
                     link: null,
                     underline: false,
                   });
                rightY += bulletHeight;
              }
            });
          }
          rightY += 15;
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
