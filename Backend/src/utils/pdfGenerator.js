import fs from 'fs';
const PDFDocument = (await import('pdfkit')).default;

export async function createATSFriendlyPDF(resumeData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      if (!resumeData || typeof resumeData !== 'object') {
        reject(new Error('Invalid resume data provided'));
        return;
      }

      const safeResumeData = {
        name: resumeData.name || 'Resume',
        title: resumeData.title || '',
        contact: resumeData.contact || {},
        summary: resumeData.summary || '',
        skills: Array.isArray(resumeData.skills) ? resumeData.skills : [],
        technologies: Array.isArray(resumeData.technologies) ? resumeData.technologies : [],
        softSkills: Array.isArray(resumeData.softSkills) ? resumeData.softSkills : [],
        languages: Array.isArray(resumeData.languages) ? resumeData.languages : [],
        experience: Array.isArray(resumeData.experience) ? resumeData.experience : [],
        education: Array.isArray(resumeData.education) ? resumeData.education : [],
        projects: Array.isArray(resumeData.projects) ? resumeData.projects : [],
        responsibilities: Array.isArray(resumeData.responsibilities) ? resumeData.responsibilities : [],
        certifications: Array.isArray(resumeData.certifications) ? resumeData.certifications : [],
        extracurricular: Array.isArray(resumeData.extracurricular) ? resumeData.extracurricular : []
      };

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 25, bottom: 200, left: 35, right: 35 }
      });
      
      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      const leftColumnWidth = pageWidth * 0.35;
      const rightColumnWidth = pageWidth * 0.62;
      const columnGap = pageWidth * 0.03;
      
      const pageHeight = doc.page.height;
      const maxY = pageHeight - doc.page.margins.bottom;
      
      let leftY = doc.page.margins.top;
      let rightY = doc.page.margins.top;
      
      const limitItems = (items, maxItems) => {
        return items.slice(0, maxItems);
      };

      const primaryColor = '#2563eb';
      const textColor = '#1f2937';
      const lightGray = '#6b7280';
      
      // Render header section
      if (safeResumeData.name) {
        try {
          doc.fontSize(20).font('Helvetica-Bold').fillColor(textColor)
             .text(String(safeResumeData.name), doc.page.margins.left, leftY, {
               width: pageWidth,
               align: 'left',
               ellipsis: false,
               break: true
             });
          leftY += doc.heightOfString(String(safeResumeData.name), { width: pageWidth }) + 8;
          rightY = leftY;
        } catch (e) {
          console.warn('Error rendering name:', e);
        }
      }

      if (safeResumeData.title) {
        try {
          doc.fontSize(14).font('Helvetica-Bold').fillColor(primaryColor)
             .text(String(safeResumeData.title), doc.page.margins.left, leftY, {
               width: pageWidth,
               align: 'left',
               ellipsis: false,
               break: true
             });
          leftY += doc.heightOfString(String(safeResumeData.title), { width: pageWidth }) + 5;
          rightY = leftY;
        } catch (e) {
          console.warn('Error rendering title:', e);
        }
      }
      
      if (safeResumeData.education && safeResumeData.education.length > 0) {
        const firstEdu = safeResumeData.education[0];
        if (firstEdu && firstEdu.institution) {
          try {
            doc.fontSize(10).font('Helvetica').fillColor(textColor)
               .text(String(firstEdu.institution), doc.page.margins.left, leftY, {
                 width: pageWidth,
                 align: 'left',
                 ellipsis: false,
                 break: true
               });
            leftY += doc.heightOfString(String(firstEdu.institution), { width: pageWidth }) + 8;
            rightY = leftY;
          } catch (e) {
            console.warn('Error rendering institution:', e);
          }
        }
      }

      let contactInfo = [];
      const contact = safeResumeData.contact || {};
      if (contact.phone) contactInfo.push(String(contact.phone));
      if (contact.email) contactInfo.push(String(contact.email));
      if (contact.linkedin) contactInfo.push(String(contact.linkedin));
      if (contact.location) contactInfo.push(String(contact.location));

      if (contactInfo.length > 0) {
        const contactText = contactInfo.join(' | ');
        doc.fontSize(10).font('Helvetica').fillColor(lightGray)
           .text(contactText, doc.page.margins.left, leftY, {
             width: pageWidth,
             align: 'left',
             ellipsis: true,
             lineGap: 2
           });
        leftY += doc.heightOfString(contactText, { width: pageWidth }) + 5;
        rightY = leftY;
      }

      doc.strokeColor('#e5e7eb').lineWidth(1)
         .moveTo(doc.page.margins.left, leftY)
         .lineTo(doc.page.width - doc.page.margins.right, leftY)
         .stroke();
      leftY += 12;
      rightY += 12;

      // Render left column sections
      const leftColumnX = doc.page.margins.left;
      if (safeResumeData.summary) {
        try {
          leftY = addSectionHeader(doc, 'SUMMARY', leftColumnX, leftY, primaryColor);
          doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
             .text(String(safeResumeData.summary), leftColumnX, leftY, { 
               width: leftColumnWidth, 
               align: 'left',
               lineGap: 1.5,
               ellipsis: false,
               break: true
             });
          leftY += doc.heightOfString(String(safeResumeData.summary), { width: leftColumnWidth, lineGap: 1.5 }) + 12;
        } catch (e) {
          console.warn('Error rendering summary:', e);
        }
      }
      
      if (safeResumeData.skills && safeResumeData.skills.length > 0) {
        try {
          leftY = addSectionHeader(doc, 'SKILLS', leftColumnX, leftY, primaryColor);
          const skillsText = safeResumeData.skills.map(s => String(s || '')).filter(s => s).join(' • ');
          if (skillsText) {
            doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
               .text(skillsText, leftColumnX, leftY, { 
                 width: leftColumnWidth,
                 align: 'left',
                 lineGap: 1.5,
                 ellipsis: false,
                 break: true
               });
            leftY += doc.heightOfString(skillsText, { width: leftColumnWidth, lineGap: 1.5 }) + 10;
          }
        } catch (e) {
          console.warn('Error rendering skills:', e);
        }
      }
      
      if (safeResumeData.technologies && safeResumeData.technologies.length > 0) {
        try {
          leftY = addSectionHeader(doc, 'TECHNICAL SKILLS', leftColumnX, leftY, primaryColor);
          const techText = safeResumeData.technologies.filter(tech => tech).map(t => String(t)).join(', ');
          if (techText) {
            doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
               .text(techText, leftColumnX, leftY, { 
                 width: leftColumnWidth,
                 align: 'left',
                 lineGap: 1.5,
                 ellipsis: false,
                 break: true
               });
            leftY += doc.heightOfString(techText, { width: leftColumnWidth, lineGap: 1.5 }) + 10;
          }
        } catch (e) {
          console.warn('Error rendering technologies:', e);
        }
      }
      
      if (safeResumeData.softSkills && safeResumeData.softSkills.length > 0) {
        try {
          leftY = addSectionHeader(doc, 'SOFT SKILLS', leftColumnX, leftY, primaryColor);
          const limitedSkills = limitItems(safeResumeData.softSkills, 8);
          const skillsText = limitedSkills.filter(skill => skill).map(s => String(s)).join(', ');
          if (skillsText) {
            doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
               .text(skillsText, leftColumnX, leftY, { 
                 width: leftColumnWidth,
                 align: 'left',
                 lineGap: 1.5,
                 ellipsis: false,
                 break: true
               });
            leftY += doc.heightOfString(skillsText, { width: leftColumnWidth, lineGap: 1.5 }) + 10;
          }
        } catch (e) {
          console.warn('Error rendering soft skills:', e);
        }
      }
      
      if (safeResumeData.languages && safeResumeData.languages.length > 0) {
        try {
          leftY = addSectionHeader(doc, 'LANGUAGES KNOWN', leftColumnX, leftY, primaryColor);
          const langsText = safeResumeData.languages.filter(lang => lang).map(l => String(l)).join(', ');
          if (langsText) {
            doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
               .text(langsText, leftColumnX, leftY, { 
                 width: leftColumnWidth,
                 align: 'left',
                 lineGap: 1.5,
                 ellipsis: false,
                 break: true
               });
            leftY += doc.heightOfString(langsText, { width: leftColumnWidth, lineGap: 1.5 }) + 10;
          }
        } catch (e) {
          console.warn('Error rendering languages:', e);
        }
      }
      
      if (safeResumeData.extracurricular && safeResumeData.extracurricular.length > 0) {
        try {
          leftY = addSectionHeader(doc, 'EXTRACURRICULAR ACTIVITY', leftColumnX, leftY, primaryColor);
          safeResumeData.extracurricular.forEach(extra => {
            if (!extra || typeof extra !== 'object') return;
              
              let extraText = '';
              if (extra.title) extraText += extra.title;
              if (extra.description) extraText += (extraText ? ' - ' : '') + String(extra.description);
              
              if (extraText) {
                doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
                   .text(`• ${extraText}`, leftColumnX, leftY, { 
                     width: leftColumnWidth,
                     align: 'left',
                     lineGap: 1.5,
                     ellipsis: false,
                     break: true
                   });
                leftY += doc.heightOfString(`• ${extraText}`, { width: leftColumnWidth, lineGap: 1.5 }) + 3;
              }
            });
            leftY += 5;
        } catch (e) {
          console.warn('Error rendering extracurricular:', e);
        }
      }
      
      if (safeResumeData.certifications && safeResumeData.certifications.length > 0) {
        try {
          leftY = addSectionHeader(doc, 'CERTIFICATIONS', leftColumnX, leftY, primaryColor);
          safeResumeData.certifications.forEach(cert => {
            if (!cert) return;
              const certText = String(cert);
              doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
                 .text(`• ${certText}`, leftColumnX, leftY, { 
                   width: leftColumnWidth,
                   align: 'left',
                   lineGap: 1.5,
                   ellipsis: false,
                   break: true
                 });
              leftY += doc.heightOfString(`• ${certText}`, { width: leftColumnWidth, lineGap: 1.5 }) + 2;
            });
            leftY += 5;
        } catch (e) {
          console.warn('Error rendering certifications:', e);
        }
      }

      // Render right column sections
      const rightColumnX = doc.page.margins.left + leftColumnWidth + columnGap;
      
      const internships = safeResumeData.experience.filter(exp => 
        exp.title && (exp.title.toLowerCase().includes('intern') || 
        exp.company && exp.company.toLowerCase().includes('internship'))
      );
      const regularExperience = safeResumeData.experience.filter(exp => 
        !exp.title || (!exp.title.toLowerCase().includes('intern') && 
        (!exp.company || !exp.company.toLowerCase().includes('internship')))
      );
      
      if (internships.length > 0) {
        rightY = addSectionHeader(doc, 'INTERNSHIP', rightColumnX, rightY, primaryColor);
        
        internships.forEach((exp) => {
          try {
            if (!exp || typeof exp !== 'object') return;
            
            const expTitle = exp.title || 'Intern';
            doc.fontSize(9.5).font('Helvetica-Bold').fillColor(textColor)
               .text(String(expTitle), rightColumnX, rightY, { 
                 width: rightColumnWidth,
                 align: 'left',
                 ellipsis: false,
                 break: true
               });
            rightY += doc.heightOfString(String(expTitle), { width: rightColumnWidth }) + 2;

            let companyDuration = '';
            const company = exp.company || '';
            const duration = exp.duration || '';
            if (company && duration) {
              companyDuration = `${company} | ${duration}`;
            } else if (company) {
              companyDuration = company;
            } else if (duration) {
              companyDuration = duration;
            }

            if (companyDuration) {
              doc.fontSize(8.5).font('Helvetica').fillColor(primaryColor)
                 .text(`  ${companyDuration}`, rightColumnX, rightY, { 
                   width: rightColumnWidth,
                   align: 'left',
                   ellipsis: false,
                   break: true
                 });
              rightY += doc.heightOfString(`  ${companyDuration}`, { width: rightColumnWidth }) + 4;
            }

            const descriptions = Array.isArray(exp.description) ? exp.description : [];
            if (descriptions.length > 0) {
              descriptions.forEach(desc => {
                if (!desc) return;
                const cleanDesc = String(desc).trim();
                if (cleanDesc) {
                  doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
                     .text(`  • ${cleanDesc}`, rightColumnX, rightY, { 
                       width: rightColumnWidth,
                       align: 'left',
                       lineGap: 1.5,
                       ellipsis: false,
                       break: true
                     });
                  rightY += doc.heightOfString(`  • ${cleanDesc}`, { width: rightColumnWidth, lineGap: 1.5 }) + 2;
                }
              });
            }
          } catch (e) {
            console.warn('Error rendering internship entry:', e);
          }

          rightY += 5;
        });
        rightY += 5;
      }
      
      if (regularExperience.length > 0) {
        rightY = addSectionHeader(doc, 'EXPERIENCE', rightColumnX, rightY, primaryColor);
        
        regularExperience.forEach((exp) => {
          try {
            if (!exp || typeof exp !== 'object') return;
            
            const expTitle = exp.title || '';
            if (expTitle) {
              doc.fontSize(9.5).font('Helvetica-Bold').fillColor(textColor)
                 .text(String(expTitle), rightColumnX, rightY, { 
                   width: rightColumnWidth,
                   align: 'left',
                   ellipsis: false,
                   break: true
                 });
              rightY += doc.heightOfString(String(expTitle), { width: rightColumnWidth }) + 2;
            }

            let companyDuration = '';
            const company = exp.company || '';
            const duration = exp.duration || '';
            if (company && duration) {
              companyDuration = `${company} | ${duration}`;
            } else if (company) {
              companyDuration = company;
            } else if (duration) {
              companyDuration = duration;
            }

            if (companyDuration) {
              doc.fontSize(8.5).font('Helvetica').fillColor(primaryColor)
                 .text(String(companyDuration), rightColumnX, rightY, { 
                   width: rightColumnWidth,
                   align: 'left',
                   ellipsis: false,
                   break: true
                 });
              rightY += doc.heightOfString(String(companyDuration), { width: rightColumnWidth }) + 4;
            }

            const descriptions = Array.isArray(exp.description) ? exp.description : [];
            if (descriptions.length > 0) {
              descriptions.forEach(desc => {
                if (!desc) return;
                const cleanDesc = String(desc).trim();
                if (cleanDesc) {
                  doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
                     .text(`• ${cleanDesc}`, rightColumnX, rightY, { 
                       width: rightColumnWidth,
                       align: 'left',
                       lineGap: 1.5,
                       ellipsis: false,
                       break: true
                     });
                  rightY += doc.heightOfString(`• ${cleanDesc}`, { width: rightColumnWidth, lineGap: 1.5 }) + 2;
                }
              });
            }
          } catch (e) {
            console.warn('Error rendering experience entry:', e);
          }

          rightY += 5;
        });
      }

      if (safeResumeData.education && safeResumeData.education.length > 0) {
        rightY = addSectionHeader(doc, 'EDUCATION', rightColumnX, rightY, primaryColor);
        
        safeResumeData.education.forEach(edu => {
          try {
            if (!edu || typeof edu !== 'object') return;
              
              let firstLine = '';
              const location = edu.location || '';
              const institution = edu.institution || '';
              const degree = edu.degree || '';
              const year = edu.year || '';
              
              if (location && year) {
                firstLine = `${location} (${year})`;
              } else if (institution && year) {
                firstLine = `${institution} (${year})`;
              } else if (degree && year) {
                firstLine = `${degree} (${year})`;
              } else if (degree) {
                firstLine = degree;
              } else if (location) {
                firstLine = location;
              } else if (institution) {
                firstLine = institution;
              }
              
              if (firstLine) {
                doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
                   .text(String(firstLine), rightColumnX, rightY, { 
                     width: rightColumnWidth,
                     align: 'left',
                     ellipsis: false,
                     break: true
                   });
                rightY += doc.heightOfString(String(firstLine), { width: rightColumnWidth }) + 2;
              }
              
              const grade = edu.grade || '';
              if (grade) {
                doc.fontSize(8.5).font('Helvetica').fillColor(lightGray)
                   .text(`  • ${grade}`, rightColumnX, rightY, { 
                     width: rightColumnWidth,
                     align: 'left',
                     ellipsis: false,
                     break: true
                   });
                rightY += doc.heightOfString(`  • ${grade}`, { width: rightColumnWidth }) + 2;
              }
              
              rightY += 3;
            } catch (e) {
              console.warn('Error rendering education entry:', e);
            }
          });
          rightY += 5;
      }

      const regularProjects = safeResumeData.projects.filter(proj => 
        !proj.name || (!proj.name.toUpperCase().includes('ACADEMIC') && 
        !proj.description.some(desc => desc && desc.toLowerCase().includes('academic')))
      );
      
      if (regularProjects.length > 0) {
        rightY = addSectionHeader(doc, 'PROJECTS', rightColumnX, rightY, primaryColor);
        
        regularProjects.forEach(project => {
          try {
            if (!project || typeof project !== 'object') return;
              
              const projectName = project.name || '';
              if (projectName) {
                doc.fontSize(9.5).font('Helvetica-Bold').fillColor(textColor)
                   .text(String(projectName), rightColumnX, rightY, { 
                     width: rightColumnWidth,
                     align: 'left',
                     ellipsis: false,
                     break: true
                   });
                rightY += doc.heightOfString(String(projectName), { width: rightColumnWidth }) + 3;
              }

              const descriptions = Array.isArray(project.description) ? project.description : [];
              if (descriptions.length > 0) {
                descriptions.forEach(desc => {
                  if (!desc) return;
                  const cleanDesc = String(desc).trim();
                  if (cleanDesc) {
                    doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
                       .text(`  • ${cleanDesc}`, rightColumnX, rightY, { 
                         width: rightColumnWidth,
                         align: 'left',
                         lineGap: 1.5,
                         ellipsis: false,
                         break: true
                       });
                    rightY += doc.heightOfString(`  • ${cleanDesc}`, { width: rightColumnWidth, lineGap: 1.5 }) + 2;
                  }
                });
              }
              
              // Display project links if available
              const projectLinks = Array.isArray(project.links) ? project.links : [];
              if (projectLinks.length > 0) {
                projectLinks.forEach(linkObj => {
                  const linkUri = typeof linkObj === 'string' ? linkObj : (linkObj.uri || linkObj);
                  const linkId = typeof linkObj === 'string' ? null : (linkObj.id || null);
                  
                  if (linkUri && linkUri.trim()) {
                    const cleanLink = linkUri.trim();
                    const linkText = `🔗 ${cleanLink}`;
                    
                    try {
                      let validLink = cleanLink;
                      if (!validLink.startsWith('http://') && !validLink.startsWith('https://')) {
                        validLink = 'https://' + validLink;
                      }
                      
                      const textHeight = doc.heightOfString(linkText, { width: rightColumnWidth });
                      
                      doc.fontSize(8).font('Helvetica').fillColor('#0066cc')
                         .text(linkText, rightColumnX, rightY, { 
                           width: rightColumnWidth,
                           align: 'left',
                           underline: true,
                           ellipsis: false,
                           break: true
                         });
                      
                      const textWidth = doc.widthOfString(linkText, { width: rightColumnWidth });
                      doc.link(rightColumnX, rightY, textWidth, textHeight, validLink);
                      
                      console.log(`[PDF] Added clickable link for project "${project.name}": ${validLink} (ID: ${linkId || 'none'})`);
                      
                      rightY += textHeight + 2;
                    } catch (e) {
                      console.warn(`[PDF] Error creating link for "${cleanLink}":`, e.message);
                      doc.fontSize(8).font('Helvetica').fillColor('#0066cc')
                         .text(linkText, rightColumnX, rightY, { 
                           width: rightColumnWidth,
                           align: 'left',
                           ellipsis: false,
                           break: true
                         });
                      rightY += doc.heightOfString(linkText, { width: rightColumnWidth }) + 2;
                    }
                  }
                });
              }
              
              rightY += 5;
            } catch (e) {
              console.warn('Error rendering project entry:', e);
            }
          });
      }

      if (safeResumeData.responsibilities && safeResumeData.responsibilities.length > 0) {
        rightY = addSectionHeader(doc, 'POSITION OF RESPONSIBILITY', rightColumnX, rightY, primaryColor);
        
        safeResumeData.responsibilities.forEach(resp => {
          try {
            if (!resp || typeof resp !== 'object') return;
              
              let respText = '';
              if (resp.title) respText += resp.title;
              if (resp.organization) respText += (respText ? ', ' : '') + resp.organization;
              if (resp.description) respText += (respText ? ' - ' : '') + String(resp.description);
              
              if (respText) {
                doc.fontSize(8.5).font('Helvetica').fillColor(textColor)
                   .text(`• ${respText}`, rightColumnX, rightY, { 
                     width: rightColumnWidth,
                     align: 'left',
                     lineGap: 1.5,
                     ellipsis: false,
                     break: true
                   });
                rightY += doc.heightOfString(`• ${respText}`, { width: rightColumnWidth, lineGap: 1.5 }) + 2;
              }
            } catch (e) {
              console.warn('Error rendering responsibility entry:', e);
            }
          });
          rightY += 5;
      }

      doc.end();
      
      stream.on('finish', () => {
        resolve(outputPath);
      });
      
      stream.on('error', (error) => {
        reject(error);
      });
      
    } catch (error) {
      reject(error);
    }
  });
}

function addSectionHeader(doc, title, x, y, color) {
  doc.fontSize(10).font('Helvetica-Bold').fillColor(color)
     .text(title, x, y);
  
  const titleWidth = doc.widthOfString(title);
  doc.strokeColor(color).lineWidth(1)
     .moveTo(x, y + 10)
     .lineTo(x + titleWidth, y + 10)
     .stroke();
  
  return y + 17;
}

