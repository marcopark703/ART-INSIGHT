/**
 * ART INSIGHT — Editorial Exhibition Catalog PDF Exporter
 * 전시 도록 스타일의 A4 PDF 생성 모듈
 */

const ArtPdfExporter = {
  // 개별 작품에 대한 에디토리얼 도록 PDF 생성 및 다운로드
  async exportArtworkCatalog(artwork) {
    if (!artwork) return;

    // 로딩 인디케이터나 알림을 위한 콜백 가능
    const container = document.createElement('div');
    container.id = 'temp-pdf-container';
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '794px'; // A4 width at 96 DPI
    container.style.minHeight = '1123px'; // A4 height at 96 DPI
    container.style.backgroundColor = '#FAF9F6'; // Ivory background
    container.style.color = '#1E1E1E';
    container.style.fontFamily = "'Noto Serif KR', serif";
    container.style.boxSizing = 'border-box';
    container.style.padding = '56px 64px';

    const stars = '★'.repeat(artwork.rating || 0) + '☆'.repeat(5 - (artwork.rating || 0));
    const safeTitle = artwork.title || '제목 미상';
    const safeArtist = artwork.artist || '작가 미상';
    const formattedDate = artwork.viewDate || '날짜 미상';
    const location = artwork.location || '기록된 장소 없음';

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; justify-content: space-between; min-height: 1010px;">
        <!-- Header -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #D5D0C7; padding-bottom: 12px; margin-bottom: 36px;">
            <div>
              <span style="font-family: 'Cinzel', 'Playfair Display', serif; font-size: 14px; letter-spacing: 0.25em; text-transform: uppercase; color: #5C1D24; font-weight: 700;">
                ART INSIGHT
              </span>
              <span style="font-size: 11px; letter-spacing: 0.15em; color: #7A746B; margin-left: 10px; text-transform: uppercase;">
                Personal Archive Series
              </span>
            </div>
            <div style="font-size: 10px; letter-spacing: 0.1em; color: #9A9489; text-transform: uppercase;">
              Cat. No. ${artwork.id ? String(artwork.id).padStart(4, '0') : '0001'}
            </div>
          </div>

          <!-- Artwork Image Area -->
          <div style="background-color: #F0ECE1; border: 1px solid #E2DCCF; padding: 18px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); margin-bottom: 36px; text-align: center;">
            <div style="max-height: 480px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #EAE6DB;">
              <img src="${artwork.image}" alt="${safeTitle}" style="max-width: 100%; max-height: 480px; object-fit: contain; display: block; margin: 0 auto;" />
            </div>
          </div>

          <!-- Metadata & Title Section -->
          <div style="margin-bottom: 28px;">
            <div style="font-size: 12px; letter-spacing: 0.18em; text-transform: uppercase; color: #722F37; margin-bottom: 6px; font-weight: 600;">
              ${safeArtist}
            </div>
            <h1 style="font-size: 26px; font-weight: 700; line-height: 1.3; color: #161616; margin: 0 0 16px 0; letter-spacing: -0.02em;">
              ${safeTitle}
            </h1>
            
            <div style="display: flex; gap: 24px; font-size: 11px; color: #6E685F; border-top: 1px solid #EAE5DC; border-bottom: 1px solid #EAE5DC; padding: 10px 0;">
              <div><strong style="color: #4A443D; font-weight: 600;">관람 장소:</strong> ${location}</div>
              <div><strong style="color: #4A443D; font-weight: 600;">관람 일자:</strong> ${formattedDate}</div>
              <div><strong style="color: #4A443D; font-weight: 600;">개인 평점:</strong> <span style="color: #5C1D24; letter-spacing: 2px;">${stars}</span></div>
            </div>
          </div>

          <!-- Personal Impression & Notes -->
          <div style="margin-top: 20px;">
            <div style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #8F887D; margin-bottom: 8px;">
              Curator's Personal Impression & Reflection
            </div>
            <div style="font-size: 13.5px; line-height: 1.85; color: #2C2C2C; white-space: pre-line; background: #F6F4ED; padding: 20px 24px; border-left: 3px solid #5C1D24; font-style: normal;">
              ${artwork.notes ? artwork.notes : '기록된 감상 메모가 없습니다. 훗날 다시 이 작품을 마주했을 때 전해지는 울림을 새롭게 채워보세요.'}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #D5D0C7; padding-top: 14px; margin-top: 36px; display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; color: #9A9489; letter-spacing: 0.08em;">
          <div>ART INSIGHT — See beyond the canvas. 그림 너머의 이야기를 읽다.</div>
          <div>Printed Archive &copy; ${new Date().getFullYear()}</div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    const safeFilename = `ArtInsight_${safeArtist.replace(/[\/\\?%*:|"<>]/g, '')}_${safeTitle.replace(/[\/\\?%*:|"<>]/g, '')}.pdf`;

    const opt = {
      margin: 0,
      filename: safeFilename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#FAF9F6',
        letterRendering: true 
      },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
    };

    try {
      await html2pdf().set(opt).from(container).save();
    } catch (err) {
      console.error('PDF 내보내기 실패:', err);
      alert('PDF 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      document.body.removeChild(container);
    }
  }
};

window.ArtPdfExporter = ArtPdfExporter;
