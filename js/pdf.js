/**
 * ART INSIGHT — Editorial Exhibition Catalog PDF Exporter
 * AI 심층 도슨트 분석 리포트 및 개인 감상이 통합된 전시 도록 PDF 생성
 */

const ArtPdfExporter = {
  async exportArtworkCatalog(artwork) {
    if (!artwork) return;

    const container = document.createElement('div');
    container.id = 'temp-pdf-container';
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = '794px'; // A4 width at 96 DPI
    container.style.backgroundColor = '#FAF9F6';
    container.style.color = '#1E1E1E';
    container.style.fontFamily = "'Noto Serif KR', serif";
    container.style.boxSizing = 'border-box';
    container.style.padding = '52px 60px';

    const stars = '★'.repeat(artwork.rating || 0) + '☆'.repeat(5 - (artwork.rating || 0));
    const safeTitle = artwork.title || '제목 미상';
    const safeArtist = artwork.artist || '작가 미상';
    const formattedDate = artwork.viewDate || '날짜 미상';
    const location = artwork.location || '기록된 장소 없음';
    const r = artwork.analysisReport;

    let aiReportHtml = '';
    if (r) {
      aiReportHtml = `
        <div style="margin-top: 32px; border-top: 2px solid #5C1D24; padding-top: 20px;">
          <div style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #722F37; font-weight: 700; margin-bottom: 12px;">
            AI Docent Curatorial Analysis & Review
          </div>

          <!-- First Impression -->
          <div style="margin-bottom: 18px;">
            <div style="font-size: 11px; font-weight: bold; color: #3A352F; margin-bottom: 4px;">[ 작품의 첫인상과 시각적 분위기 ]</div>
            <div style="font-size: 12.5px; line-height: 1.8; color: #2B2825; white-space: pre-line; background: #F5F1E8; padding: 12px 16px;">
              ${r.firstImpression || ''}
            </div>
          </div>

          <!-- Historical Context -->
          ${r.artHistoricalContext ? `
          <div style="margin-bottom: 18px;">
            <div style="font-size: 11px; font-weight: bold; color: #3A352F; margin-bottom: 4px;">[ 미술사적 맥락 및 사조 상호작용 ]</div>
            <div style="font-size: 12px; line-height: 1.75; color: #333;">
              ${r.artHistoricalContext.narrative || ''}
            </div>
          </div>
          ` : ''}

          <!-- Formal Elements -->
          ${r.formalElements ? `
          <div style="margin-bottom: 18px; font-size: 11.5px; line-height: 1.6; background: #FFFFFF; border: 1px solid #E5DFD4; padding: 12px 16px;">
            <div style="font-weight: bold; color: #5C1D24; margin-bottom: 6px;">[ 주요 조형적 특징 ]</div>
            <div><strong>색채:</strong> ${r.formalElements.color || ''}</div>
            <div style="margin-top: 4px;"><strong>구도 및 공간:</strong> ${r.formalElements.composition || ''}</div>
            <div style="margin-top: 4px;"><strong>붓질 및 마티에르:</strong> ${r.formalElements.brushworkAndTexture || ''}</div>
          </div>
          ` : ''}

          <!-- Similar Artists -->
          ${r.similarArtists && r.similarArtists.length ? `
          <div style="margin-bottom: 18px;">
            <div style="font-size: 11px; font-weight: bold; color: #3A352F; margin-bottom: 6px;">[ 조형적 연관성을 지닌 유사 화풍 작가 ]</div>
            <div style="display: flex; gap: 8px;">
              ${r.similarArtists.map(a => `
                <div style="flex: 1; background: #F8F5EE; border: 1px solid #E8E2D5; padding: 8px 10px; font-size: 10.5px;">
                  <strong style="color: #722F37;">${a.name}</strong><br/>
                  <span style="color: #666; font-size: 10px;">${a.artisticStyle}</span><br/>
                  <span style="font-size: 10px; color: #333; margin-top: 3px; display: block;">대표작: ${a.keyWork}</span>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Author Intent vs AI -->
          ${r.authorIntentVsAiPerspective && r.authorIntentVsAiPerspective.hasAuthorNote ? `
          <div style="margin-bottom: 18px; font-size: 11.5px; line-height: 1.7; background: #F6F3EC; border-left: 3px solid #5C1D24; padding: 10px 14px;">
            <strong style="color: #5C1D24;">[ 작가의 의도와 AI의 시각적 해석 비교 ]</strong><br/>
            ${r.authorIntentVsAiPerspective.comparativeAnalysis}
          </div>
          ` : ''}
        </div>
      `;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; justify-content: space-between;">
        <!-- Header -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #D5D0C7; padding-bottom: 10px; margin-bottom: 24px;">
            <div>
              <span style="font-family: 'Cinzel', serif; font-size: 14px; letter-spacing: 0.25em; text-transform: uppercase; color: #5C1D24; font-weight: 700;">
                ART INSIGHT
              </span>
              <span style="font-size: 10px; letter-spacing: 0.15em; color: #7A746B; margin-left: 10px; text-transform: uppercase;">
                Exhibition Curatorial Catalog
              </span>
            </div>
            <div style="font-size: 9px; letter-spacing: 0.1em; color: #9A9489; text-transform: uppercase;">
              Cat. No. ${artwork.id ? String(artwork.id).padStart(4, '0') : '0001'}
            </div>
          </div>

          <!-- Artwork Image Area -->
          <div style="background-color: #F0ECE1; border: 1px solid #E2DCCF; padding: 14px; margin-bottom: 24px; text-align: center;">
            <div style="max-height: 420px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #EAE6DB;">
              <img src="${artwork.image}" alt="${safeTitle}" style="max-width: 100%; max-height: 420px; object-fit: contain; display: block; margin: 0 auto;" />
            </div>
          </div>

          <!-- Metadata & Title Section -->
          <div style="margin-bottom: 20px;">
            <div style="font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: #722F37; margin-bottom: 4px; font-weight: 600;">
              ${safeArtist}
            </div>
            <h1 style="font-size: 22px; font-weight: 700; line-height: 1.3; color: #161616; margin: 0 0 12px 0;">
              ${safeTitle}
            </h1>
            
            <div style="display: flex; gap: 20px; font-size: 10.5px; color: #6E685F; border-top: 1px solid #EAE5DC; border-bottom: 1px solid #EAE5DC; padding: 8px 0;">
              <div><strong>관람 장소:</strong> ${location}</div>
              <div><strong>관람 일자:</strong> ${formattedDate}</div>
              <div><strong>개인 평점:</strong> <span style="color: #5C1D24; letter-spacing: 2px;">${stars}</span></div>
            </div>
          </div>

          <!-- Personal Notes -->
          ${artwork.notes ? `
          <div style="margin-top: 16px;">
            <div style="font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #8F887D; margin-bottom: 4px;">
              Curator's Personal Reflection
            </div>
            <div style="font-size: 12px; line-height: 1.7; color: #2C2C2C; white-space: pre-line; background: #FAF7F0; padding: 12px 16px; border-left: 2px solid #5C1D24;">
              ${artwork.notes}
            </div>
          </div>
          ` : ''}

          <!-- AI Detailed Docent Report Section -->
          ${aiReportHtml}
        </div>

        <!-- Footer -->
        <div style="border-top: 1px solid #D5D0C7; padding-top: 12px; margin-top: 36px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: #9A9489;">
          <div>ART INSIGHT — See beyond the canvas. 그림 너머의 이야기를 읽다.</div>
          <div>Printed Docent Archive &copy; ${new Date().getFullYear()}</div>
        </div>
      </div>
    `;

    document.body.appendChild(container);

    const safeFilename = `ArtInsight_Catalog_${safeArtist.replace(/[\/\\?%*:|"<>]/g, '')}_${safeTitle.replace(/[\/\\?%*:|"<>]/g, '')}.pdf`;

    const opt = {
      margin: 10,
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
      alert('PDF 생성 중 오류가 발생했습니다.');
    } finally {
      document.body.removeChild(container);
    }
  }
};

window.ArtPdfExporter = ArtPdfExporter;
