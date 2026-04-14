import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ExamAttempt } from "@/lib/api";

/**
 * Generates a premium PDF report of exam results for a student
 * Returns the PDF as a Blob for preview or download
 * @param studentName - Full name of the student
 * @param studentId - Student ID
 * @param stream - Stream (NATURAL_SCIENCE or SOCIAL_SCIENCE)
 * @param results - Array of exam attempts
 * @returns Promise<Blob> - The generated PDF as a Blob
 */
export async function generatePremiumResultsPDFBlob(
  studentName: string,
  studentId: string,
  stream: string,
  results: ExamAttempt[]
): Promise<Blob> {
  if (results.length === 0) {
    throw new Error("No exam results available to generate report");
  }

  // Create a hidden container for the HTML that will be converted to PDF
  const container = document.createElement("div");
  container.style.position = "absolute";
  container.style.left = "-9999px";
  container.style.width = "1200px";
  container.style.backgroundColor = "white";
  container.style.padding = "40px";
  container.style.fontFamily = "Arial, sans-serif";

  // Group results by subject
  const resultsBySubject = groupResultsBySubject(results);

  // Calculate overall stats
  const totalExams = results.length;
  const passedExams = results.filter((r) => r.score / r.totalQuestions >= 0.5).length;
  const avgPercentage = Math.round(
    results.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / results.length
  );

  const reportDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Create the HTML content for the PDF
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 3px solid #10b981; padding-bottom: 20px;">
        <h1 style="margin: 0; color: #10b981; font-size: 28px; font-weight: bold;">
          FTVTI Self-Test Exit Examination System
        </h1>
        <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">
          Premium Results Report
        </p>
      </div>

      <!-- Student Information -->
      <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
        <table style="width: 100%; font-size: 14px;">
          <tr>
            <td style="padding: 8px; font-weight: bold; width: 25%;">Student Name:</td>
            <td style="padding: 8px;">${studentName}</td>
            <td style="padding: 8px; font-weight: bold; width: 25%;">Stream:</td>
            <td style="padding: 8px;">${stream === "NATURAL_SCIENCE" ? "Natural Science" : "Social Science"}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Student ID:</td>
            <td style="padding: 8px;">${studentId}</td>
            <td style="padding: 8px; font-weight: bold;">Report Date:</td>
            <td style="padding: 8px;">${reportDate}</td>
          </tr>
        </table>
      </div>

      <!-- Overall Performance Summary -->
      <div style="margin-bottom: 30px;">
        <h2 style="margin: 0 0 15px 0; color: #10b981; font-size: 18px; font-weight: bold; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
          Overall Performance Summary
        </h2>
        <table style="width: 100%; font-size: 13px;">
          <tr style="background: #f9fafb;">
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Total Exams Taken:</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #10b981; font-weight: bold;">${totalExams}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Exams Passed:</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #10b981; font-weight: bold;">${passedExams}</td>
          </tr>
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Average Percentage:</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #10b981; font-weight: bold; font-size: 16px;">${avgPercentage}%</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Success Rate:</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; color: #10b981; font-weight: bold;">${Math.round((passedExams / totalExams) * 100)}%</td>
          </tr>
        </table>
      </div>

      <!-- Subject-wise Breakdown -->
      <div style="margin-bottom: 30px;">
        <h2 style="margin: 0 0 15px 0; color: #10b981; font-size: 18px; font-weight: bold; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
          Subject-wise Performance
        </h2>
        
        ${Object.entries(resultsBySubject)
          .map(([subjectName, subjectResults]) => {
            const bestScore = Math.max(
              ...subjectResults.map((r) => Math.round((r.score / r.totalQuestions) * 100))
            );

            return `
              <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 6px;">
                <h3 style="margin: 0 0 12px 0; color: #1f2937; font-size: 14px; font-weight: bold;">
                  ${subjectName}
                </h3>
                <table style="width: 100%; font-size: 12px;">
                  <tr style="background: #f9fafb;">
                    <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Year</th>
                    <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Attempts</th>
                    <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Scores</th>
                    <th style="padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Best Score</th>
                  </tr>
                  ${Object.entries(
                    subjectResults.reduce(
                      (acc, r) => {
                        const year = r.year || "N/A";
                        if (!acc[year]) acc[year] = [];
                        acc[year].push(r);
                        return acc;
                      },
                      {} as Record<string, ExamAttempt[]>
                    )
                  )
                    .map(([year, yearResults]) => {
                      const yearBest = Math.max(
                        ...yearResults.map((r) => Math.round((r.score / r.totalQuestions) * 100))
                      );
                      const scores = yearResults
                        .map((r) => `${r.score}/${r.totalQuestions} (${Math.round((r.score / r.totalQuestions) * 100)}%)`)
                        .join(", ");

                      return `
                        <tr>
                          <td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${year}</td>
                          <td style="padding: 8px; border-bottom: 1px solid #f3f4f6;">${yearResults.length}</td>
                          <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-size: 11px;">${scores}</td>
                          <td style="padding: 8px; border-bottom: 1px solid #f3f4f6; font-weight: bold; color: ${yearBest >= 50 ? "#10b981" : "#ef4444"};">
                            ${yearBest}%
                          </td>
                        </tr>
                      `;
                    })
                    .join("")}
                </table>
              </div>
            `;
          })
          .join("")}
      </div>

      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #999; font-size: 11px;">
        <p style="margin: 5px 0;">
          This report is generated from FTVTI Self-Test Exit Examination System
        </p>
        <p style="margin: 5px 0;">
          For Self-Practice Purpose Only • Generated on ${reportDate}
        </p>
        <p style="margin: 5px 0; color: #bbb;">
          © FTVTI System
        </p>
      </div>
    </div>
  `;

  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    // Convert HTML to canvas using html2canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    // Create PDF and add the canvas image
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calculate image dimensions to fit the page
    const imgWidth = pdfWidth - 20; // Leave margins
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    // Add image to PDF, creating new pages if needed
    pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight - 20;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    // Return the PDF as a Blob
    return pdf.output("blob");
  } finally {
    // Clean up the hidden container
    document.body.removeChild(container);
  }
}

/**
 * Triggers download of a PDF blob with the specified filename
 * @param pdfBlob - The PDF file as a Blob
 * @param filename - The filename for the downloaded file
 */
export function downloadPDFBlob(pdfBlob: Blob, filename: string): void {
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates a data URL for previewing the PDF in an iframe
 * @param pdfBlob - The PDF file as a Blob
 * @returns Data URL string for the PDF
 */
export function generatePDFPreviewURL(pdfBlob: Blob): string {
  return URL.createObjectURL(pdfBlob);
}

/**
 * Groups exam results by subject name
 */
function groupResultsBySubject(results: ExamAttempt[]): Record<string, ExamAttempt[]> {
  return results.reduce(
    (acc, result) => {
      const subjectName = result.subject?.name || "Unknown Subject";
      if (!acc[subjectName]) {
        acc[subjectName] = [];
      }
      acc[subjectName].push(result);
      return acc;
    },
    {} as Record<string, ExamAttempt[]>
  );
}
