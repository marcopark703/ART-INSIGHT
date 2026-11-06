/**
 * ART INSIGHT — Core Application Controller
 * AI 작품 분석 중심의 인터랙션 및 아카이브 연동 로직
 */

document.addEventListener('DOMContentLoaded', async () => {
  lucide.createIcons();

  // 앱 상태 관리
  const state = {
    currentTab: 'analysis', // 'analysis' | 'archive'
    mainImageDataUrl: null,
    labelImageDataUrl: null,
    currentAnalysisResult: null,
    saveRating: 0,
    artworks: [],
    selectedArtwork: null,
    searchKeyword: '',
    ratingFilter: 0,
    sortBy: 'latest'
  };

  // DOM 캐싱
  const elements = {
    // 탭 네비게이션
    navAnalysis: document.getElementById('nav-analysis'),
    navArchive: document.getElementById('nav-archive'),
    navAnalysisMobile: document.getElementById('nav-analysis-mobile'),
    navArchiveMobile: document.getElementById('nav-archive-mobile'),
    viewAnalysis: document.getElementById('view-analysis'),
    viewArchive: document.getElementById('view-archive'),

    // API Key 모달 및 상태
    btnOpenApiKey: document.getElementById('btn-open-api-key'),
    modalApiKey: document.getElementById('modal-api-key'),
    btnCloseApiKey: document.getElementById('btn-close-api-key'),
    inputGeminiApiKey: document.getElementById('input-gemini-api-key'),
    btnSaveApiKey: document.getElementById('btn-save-api-key'),
    btnDeleteApiKey: document.getElementById('btn-delete-api-key'),
    apiStatusDot: document.getElementById('api-status-dot'),
    apiStatusLabel: document.getElementById('api-status-label'),
    bannerApiKeyWarning: document.getElementById('banner-api-key-warning'),

    // 분석 입력 영역
    analysisInputContainer: document.getElementById('analysis-input-container'),
    analysisMainImageInput: document.getElementById('analysis-main-image-input'),
    analysisDropzone: document.getElementById('analysis-dropzone'),
    analysisMainPreviewBox: document.getElementById('analysis-main-preview-box'),
    analysisMainPreviewImg: document.getElementById('analysis-main-preview-img'),
    btnRemoveMainImg: document.getElementById('btn-remove-main-img'),
    analysisAuthorNotes: document.getElementById('analysis-author-notes'),
    analysisLabelImageInput: document.getElementById('analysis-label-image-input'),
    btnTriggerLabelUpload: document.getElementById('btn-trigger-label-upload'),
    labelImageStatus: document.getElementById('label-image-status'),
    btnRemoveLabelImg: document.getElementById('btn-remove-label-img'),
    btnStartAnalysis: document.getElementById('btn-start-analysis'),

    // 분석 로딩 영역
    analysisLoading: document.getElementById('analysis-loading'),
    loadingStageText: document.getElementById('loading-stage-text'),

    // 분석 결과 에디토리얼 리포트 영역
    analysisResultView: document.getElementById('analysis-result-view'),
    btnResultReset: document.getElementById('btn-result-reset'),
    btnResultExportPdf: document.getElementById('btn-result-export-pdf'),
    resultDisplayImage: document.getElementById('result-display-image'),
    resultDisplayTitle: document.getElementById('result-display-title'),
    resultDisplayArtist: document.getElementById('result-display-artist'),
    resultFirstImpression: document.getElementById('result-first-impression'),
    resultMovementsTags: document.getElementById('result-movements-tags'),
    resultHistoricalNarrative: document.getElementById('result-historical-narrative'),
    resultFormalColor: document.getElementById('result-formal-color'),
    resultFormalComposition: document.getElementById('result-formal-composition'),
    resultFormalForm: document.getElementById('result-formal-form'),
    resultFormalTexture: document.getElementById('result-formal-texture'),
    resultFormalLight: document.getElementById('result-formal-light'),
    resultSimilarArtistsContainer: document.getElementById('result-similar-artists-container'),
    resultInterpSymbols: document.getElementById('result-interp-symbols'),
    resultInterpPerspectives: document.getElementById('result-interp-perspectives'),
    resultAuthorVsAi: document.getElementById('result-author-vs-ai'),
    resultGuideFocus: document.getElementById('result-guide-focus'),
    resultGuideQuestions: document.getElementById('result-guide-questions'),

    // 결과 하단 아카이브 저장 폼
    archiveSaveTitle: document.getElementById('archive-save-title'),
    archiveSaveArtist: document.getElementById('archive-save-artist'),
    archiveSaveLocation: document.getElementById('archive-save-location'),
    archiveSaveDate: document.getElementById('archive-save-date'),
    saveStarRating: document.getElementById('save-star-rating'),
    archiveSaveNotes: document.getElementById('archive-save-notes'),
    btnConfirmSaveArchive: document.getElementById('btn-confirm-save-archive'),

    // 아카이브 뷰
    archiveGrid: document.getElementById('archive-grid'),
    emptyState: document.getElementById('empty-state'),
    searchInput: document.getElementById('search-input'),
    ratingFilterSelect: document.getElementById('rating-filter'),
    sortSelect: document.getElementById('sort-select'),
    totalCountBadge: document.getElementById('total-count-badge'),

    // 아카이브 상세 모달
    modalDetail: document.getElementById('modal-detail'),
    btnCloseDetail: document.getElementById('btn-close-detail'),
    btnDetailExportPdf: document.getElementById('btn-detail-export-pdf'),
    btnDetailEdit: document.getElementById('btn-detail-edit'),
    btnDetailDelete: document.getElementById('btn-detail-delete'),
    detailBodyContainer: document.getElementById('detail-body-container')
  };

  // 1. 앱 초기화
  async function init() {
    updateApiKeyStatusUI();
    setupStarRating(elements.saveStarRating, (r) => { state.saveRating = r; });
    
    // 오늘 날짜 기본 세팅
    if (elements.archiveSaveDate) {
      elements.archiveSaveDate.value = new Date().toISOString().slice(0, 10);
    }

    setupEventListeners();
    await loadArchive();
  }

  // 2. API Key 상태 UI 업데이트
  function updateApiKeyStatusUI() {
    const hasKey = ArtAiDocent.hasApiKey();
    if (hasKey) {
      elements.apiStatusDot.className = 'w-2 h-2 rounded-full bg-emerald-600';
      elements.apiStatusLabel.textContent = 'AI 연결됨';
      elements.bannerApiKeyWarning.classList.add('hidden');
    } else {
      elements.apiStatusDot.className = 'w-2 h-2 rounded-full bg-amber-500 animate-pulse';
      elements.apiStatusLabel.textContent = 'API 키 설정 필요';
      elements.bannerApiKeyWarning.classList.remove('hidden');
    }
  }

  // 3. 탭 전환
  function switchTab(tab) {
    state.currentTab = tab;
    if (tab === 'analysis') {
      elements.viewAnalysis.classList.remove('hidden');
      elements.viewArchive.classList.add('hidden');
      
      elements.navAnalysis.classList.add('text-burgundy', 'border-b-2', 'border-burgundy');
      elements.navArchive.classList.remove('text-burgundy', 'border-b-2', 'border-burgundy');
      elements.navAnalysisMobile?.classList.add('text-burgundy');
      elements.navArchiveMobile?.classList.remove('text-burgundy');
    } else {
      elements.viewAnalysis.classList.add('hidden');
      elements.viewArchive.classList.remove('hidden');
      
      elements.navArchive.classList.add('text-burgundy', 'border-b-2', 'border-burgundy');
      elements.navAnalysis.classList.remove('text-burgundy', 'border-b-2', 'border-burgundy');
      elements.navArchiveMobile?.classList.add('text-burgundy');
      elements.navAnalysisMobile?.classList.remove('text-burgundy');

      loadArchive();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    lucide.createIcons();
  }

  // 4. 이미지 압축 처리 (Canvas 리사이징)
  function optimizeImage(file, maxDimension = 1600, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            }
          } else {
            if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // 5. 별점 UI 헬퍼
  function setupStarRating(container, onSelect) {
    container.innerHTML = [1, 2, 3, 4, 5].map(val => `
      <button type="button" class="star-btn" data-value="${val}">★</button>
    `).join('');

    container.querySelectorAll('.star-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const val = Number(btn.dataset.value);
        onSelect(val);
        updateStarUI(container, val);
      });
    });
  }

  function updateStarUI(container, rating) {
    container.querySelectorAll('.star-btn').forEach(btn => {
      const val = Number(btn.dataset.value);
      if (val <= rating) {
        btn.classList.add('active');
        btn.style.color = '#5C1D24';
      } else {
        btn.classList.remove('active');
        btn.style.color = '#D8D2C6';
      }
    });
  }

  // 6. AI 작품 분석 실행
  async function startAnalysis() {
    // API 키 확인
    if (!ArtAiDocent.hasApiKey()) {
      elements.modalApiKey.classList.remove('hidden');
      alert('AI 작품 분석을 위해 먼저 Gemini API 키를 등록해주세요.');
      return;
    }

    // 메인 이미지 확인
    if (!state.mainImageDataUrl) {
      alert('분석할 작품 사진을 먼저 업로드해주세요.');
      return;
    }

    // UI 전환: 입력창 숨김, 로딩창 노출
    elements.analysisInputContainer.classList.add('hidden');
    elements.analysisResultView.classList.add('hidden');
    elements.analysisLoading.classList.remove('hidden');
    window.scrollTo({ top: 100, behavior: 'smooth' });

    // 감성적 프로그레스 메시지 로테이션
    const loadingMessages = [
      '화면의 붓질과 색채의 긴장감을 면밀히 관찰하고 있습니다...',
      '구도와 공간의 배치, 시선의 흐름을 추적하고 있습니다...',
      '관련된 미술사적 맥락과 미술사조들의 상호작용을 해석 중입니다...',
      '시각적 유사성을 지닌 다른 거장들의 화풍과 대표작을 탐색하고 있습니다...',
      '작품이 품은 다각적 의미와 도슨트 감상 가이드를 정리하고 있습니다...'
    ];
    let msgIndex = 0;
    const msgTimer = setInterval(() => {
      msgIndex = (msgIndex + 1) % loadingMessages.length;
      elements.loadingStageText.textContent = loadingMessages[msgIndex];
    }, 2800);

    try {
      const authorNotes = elements.analysisAuthorNotes.value.trim();
      const report = await ArtAiDocent.analyzeArtwork({
        mainImageDataUrl: state.mainImageDataUrl,
        labelImageDataUrl: state.labelImageDataUrl,
        authorNotes: authorNotes,
        labelText: ''
      });

      state.currentAnalysisResult = report;
      renderAnalysisResult(report);
      
      // 로딩 종료 및 결과 화면 표시
      clearInterval(msgTimer);
      elements.analysisLoading.classList.add('hidden');
      elements.analysisResultView.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      lucide.createIcons();

    } catch (err) {
      clearInterval(msgTimer);
      elements.analysisLoading.classList.add('hidden');
      elements.analysisInputContainer.classList.remove('hidden');
      console.error('분석 에러:', err);
      alert(`AI 분석 오류: ${err.message}`);
    }
  }

  // 7. 분석 결과 화면 렌더링
  function renderAnalysisResult(report) {
    // 메인 이미지 & 헤더
    elements.resultDisplayImage.src = state.mainImageDataUrl;
    elements.resultDisplayTitle.textContent = report.suggestedTitle || '제목 미상';
    elements.resultDisplayArtist.textContent = report.suggestedArtist || '작가 미상';

    // A. 첫인상
    elements.resultFirstImpression.textContent = report.firstImpression || '첫인상 분석 정보가 없습니다.';

    // B. 미술사적 맥락
    const movements = report.artHistoricalContext?.movements || [];
    elements.resultMovementsTags.innerHTML = movements.map(m => `
      <span class="px-3 py-1 bg-[#F5EFE6] border border-[#E2DDD3] text-xs font-serifEn tracking-wider text-[#722F37] font-semibold">
        # ${escapeHtml(m)}
      </span>
    `).join('');
    elements.resultHistoricalNarrative.textContent = report.artHistoricalContext?.narrative || '';

    // C. 조형적 특징
    const fe = report.formalElements || {};
    elements.resultFormalColor.textContent = fe.color || '분석 중';
    elements.resultFormalComposition.textContent = fe.composition || '분석 중';
    elements.resultFormalForm.textContent = fe.form || '분석 중';
    elements.resultFormalTexture.textContent = fe.brushworkAndTexture || '분석 중';
    elements.resultFormalLight.textContent = fe.lightAndShadow || '분석 중';

    // D. 유사 작가 3인
    const artists = report.similarArtists || [];
    elements.resultSimilarArtistsContainer.innerHTML = artists.map(a => `
      <div class="border border-[#EAE5DA] bg-[#FAF9F6] p-5 flex flex-col justify-between space-y-3">
        <div>
          <div class="text-[11px] font-serifEn tracking-widest text-[#722F37] uppercase font-bold">Similar Master</div>
          <h4 class="font-serifKr text-base font-bold text-[#1B1A17] mt-0.5">${escapeHtml(a.name)}</h4>
          <p class="text-xs text-[#8F887D] mt-1 font-light">${escapeHtml(a.artisticStyle)}</p>
        </div>
        <div class="space-y-2 text-xs text-[#3A352F] pt-2 border-t border-[#EFEBE4]">
          <div><strong class="text-[#5C1D24]">시각적 유사점:</strong> ${escapeHtml(a.similarities)}</div>
          <div><strong class="text-[#7A746B]">화풍의 차이점:</strong> ${escapeHtml(a.differences)}</div>
          <div class="pt-1 text-[11px] text-[#8F887D] font-serif"><strong>대표 참고작:</strong> ${escapeHtml(a.keyWork)}</div>
        </div>
      </div>
    `).join('');

    // E. 상징과 다각적 해석
    const interp = report.interpretation || {};
    elements.resultInterpSymbols.textContent = interp.symbolsAndThemes || '';
    elements.resultInterpPerspectives.textContent = interp.multiplePerspectives || '';

    // F. 작가 의도 vs AI 해석 비교
    const comp = report.authorIntentVsAiPerspective || {};
    if (comp.hasAuthorNote) {
      elements.resultAuthorVsAi.innerHTML = `
        <div class="space-y-2">
          <div><strong class="text-[#5C1D24]">[작가가 밝힌 의도]</strong> ${escapeHtml(comp.authorIntent)}</div>
          <div><strong class="text-[#1B263B]">[AI 시각 관찰 사실]</strong> ${escapeHtml(comp.aiObservation)}</div>
          <div class="pt-2 border-t border-[#EAE5DA] font-medium text-[#1B1A17]">[종합 비교 분석]<br/>${escapeHtml(comp.comparativeAnalysis)}</div>
        </div>
      `;
    } else {
      elements.resultAuthorVsAi.innerHTML = `
        <div class="text-[#6B655B] italic">
          첨부된 작가 설명 자료가 없어 작가의 주관적 의도를 예단하지 않고, 작품 이미지에서 관찰되는 객관적인 시각 요소와 조형 질서에 집중하여 해석했습니다.<br/>
          (작가 노트나 라벨 사진을 첨부하면 작가 의도와 AI의 시각적 긴장감을 대조 분석할 수 있습니다.)
        </div>
      `;
    }

    // G. 감상 가이드
    const guide = report.appreciationGuide || {};
    elements.resultGuideFocus.innerHTML = (guide.focusPoints || []).map(p => `<li>${escapeHtml(p)}</li>`).join('');
    elements.resultGuideQuestions.innerHTML = (guide.reflectiveQuestions || []).map(q => `<li>${escapeHtml(q)}</li>`).join('');

    // H. 하단 아카이브 저장 폼 기본값 세팅
    elements.archiveSaveTitle.value = report.suggestedTitle || '';
    elements.archiveSaveArtist.value = report.suggestedArtist || '';
    state.saveRating = 5;
    updateStarUI(elements.saveStarRating, 5);
  }

  // 8. 아카이브에 영구 저장하기
  async function saveAnalysisToArchive() {
    if (!state.mainImageDataUrl) return;

    const artworkData = {
      title: elements.archiveSaveTitle.value,
      artist: elements.archiveSaveArtist.value,
      location: elements.archiveSaveLocation.value,
      viewDate: elements.archiveSaveDate.value,
      rating: state.saveRating,
      notes: elements.archiveSaveNotes.value,
      image: state.mainImageDataUrl,
      labelImage: state.labelImageDataUrl,
      authorNotes: elements.analysisAuthorNotes.value,
      analysisReport: state.currentAnalysisResult
    };

    try {
      await ArtStorage.addArtwork(artworkData);
      alert('나의 작품 보관함에 안전하게 저장되었습니다!');
      switchTab('archive');
    } catch (err) {
      console.error('아카이브 저장 실패:', err);
      alert('저장에 실패했습니다.');
    }
  }

  // 9. 아카이브 목록 로드 및 렌더링
  async function loadArchive() {
    const artworks = await ArtStorage.searchArtworks(
      state.searchKeyword,
      state.ratingFilter,
      state.sortBy
    );
    state.artworks = artworks;

    if (elements.totalCountBadge) {
      elements.totalCountBadge.textContent = `${artworks.length}개 작품`;
    }

    if (artworks.length === 0) {
      elements.archiveGrid.innerHTML = '';
      elements.emptyState.classList.remove('hidden');
      return;
    }

    elements.emptyState.classList.add('hidden');
    elements.archiveGrid.innerHTML = artworks.map(item => `
      <article class="artwork-card group cursor-pointer bg-white border border-[#E8E4DC] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col" data-id="${item.id}">
        <div class="relative w-full aspect-[4/5] bg-[#F4F1EA] overflow-hidden flex items-center justify-center p-3">
          <img src="${item.image}" alt="${escapeHtml(item.title)}" class="w-full h-full object-contain transition-transform duration-500 group-hover:scale-102" loading="lazy" />
          <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[11px] font-serif text-[#5C1D24] tracking-widest border border-[#E2DDD3]">
            ${'★'.repeat(item.rating || 0)}${'☆'.repeat(5 - (item.rating || 0))}
          </div>
          ${item.analysisReport ? `
            <div class="absolute bottom-3 left-3 bg-[#5C1D24] text-white px-2 py-0.5 text-[10px] tracking-wider uppercase font-serif">
              AI Docent Analyzed
            </div>
          ` : ''}
        </div>
        <div class="p-5 flex-1 flex flex-col justify-between bg-white border-t border-[#EAE6DE]">
          <div>
            <div class="text-[11px] font-serif tracking-[0.16em] uppercase text-[#722F37] mb-1 font-semibold truncate">
              ${escapeHtml(item.artist)}
            </div>
            <h3 class="font-serifKr text-base font-semibold text-[#1F1E1C] line-clamp-1 mb-2 group-hover:text-[#5C1D24] transition-colors">
              ${escapeHtml(item.title)}
            </h3>
            ${item.notes ? `
              <p class="text-xs text-[#696359] line-clamp-2 leading-relaxed font-sans mb-3 font-light">
                ${escapeHtml(item.notes)}
              </p>
            ` : (item.analysisReport?.firstImpression ? `
              <p class="text-xs text-[#696359] line-clamp-2 leading-relaxed font-serifKr mb-3 font-light">
                ${escapeHtml(item.analysisReport.firstImpression)}
              </p>
            ` : '')}
          </div>
          <div class="pt-3 border-t border-[#F2EFE8] flex items-center justify-between text-[11px] text-[#8E877C]">
            <div class="truncate">${escapeHtml(item.location) || '장소 미입력'}</div>
            <div class="shrink-0 text-[10.5px]">${escapeHtml(item.viewDate) || ''}</div>
          </div>
        </div>
      </article>
    `).join('');

    lucide.createIcons();

    // 카드 클릭 시 상세 모달 오픈
    document.querySelectorAll('.artwork-card').forEach(card => {
      card.addEventListener('click', () => {
        openDetailModal(card.dataset.id);
      });
    });
  }

  // 10. 아카이브 상세 모달
  async function openDetailModal(id) {
    const artwork = await ArtStorage.getArtworkById(id);
    if (!artwork) return;
    state.selectedArtwork = artwork;

    const r = artwork.analysisReport;
    const stars = '★'.repeat(artwork.rating || 0) + '☆'.repeat(5 - (artwork.rating || 0));

    let reportSection = '';
    if (r) {
      reportSection = `
        <div class="border-t-2 border-[#5C1D24] pt-6 space-y-6">
          <div class="text-xs font-serifEn tracking-[0.2em] uppercase text-[#722F37] font-bold">
            Curatorial AI Docent Report
          </div>

          <!-- First Impression -->
          <div class="space-y-1">
            <h4 class="font-serifKr text-sm font-bold text-[#1B1A17]">[ 작품의 첫인상 ]</h4>
            <div class="text-xs sm:text-sm text-[#2E2C28] leading-relaxed bg-[#FAF7F0] p-4 whitespace-pre-line border-l-2 border-[#5C1D24]">
              ${escapeHtml(r.firstImpression)}
            </div>
          </div>

          <!-- Historical Context -->
          <div class="space-y-1">
            <h4 class="font-serifKr text-sm font-bold text-[#1B1A17]">[ 미술사적 맥락 및 사조 상호작용 ]</h4>
            <div class="text-xs text-[#333] leading-relaxed bg-white border border-[#E8E3D7] p-4 whitespace-pre-line">
              ${escapeHtml(r.artHistoricalContext?.narrative || '')}
            </div>
          </div>

          <!-- Similar Artists -->
          ${r.similarArtists?.length ? `
            <div class="space-y-1">
              <h4 class="font-serifKr text-sm font-bold text-[#1B1A17]">[ 유사 화풍의 작가 3인 ]</h4>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                ${r.similarArtists.map(a => `
                  <div class="border border-[#E8E3D7] bg-white p-3 space-y-1">
                    <strong class="text-[#722F37]">${escapeHtml(a.name)}</strong>
                    <div class="text-[11px] text-[#666]">${escapeHtml(a.artisticStyle)}</div>
                    <div class="text-[11px] text-[#333] pt-1 border-t border-[#F2EFE8]">유사점: ${escapeHtml(a.similarities)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Interpretation & Guide -->
          <div class="space-y-1">
            <h4 class="font-serifKr text-sm font-bold text-[#1B1A17]">[ 작품의 상징과 해석 ]</h4>
            <p class="text-xs text-[#333] bg-white border border-[#E8E3D7] p-3 leading-relaxed">
              ${escapeHtml(r.interpretation?.symbolsAndThemes || '')}
            </p>
          </div>
        </div>
      `;
    }

    elements.detailBodyContainer.innerHTML = `
      <div class="bg-[#F2ECE1] border border-[#E2DDD3] p-4 flex items-center justify-center">
        <img src="${artwork.image}" alt="${escapeHtml(artwork.title)}" class="max-h-[480px] w-auto max-w-full object-contain mx-auto shadow-md" />
      </div>

      <div class="border-b border-[#E8E3D7] pb-4">
        <div class="font-serifEn text-sm tracking-[0.2em] uppercase text-[#722F37] font-semibold mb-1">
          ${escapeHtml(artwork.artist)}
        </div>
        <h1 class="font-serifKr text-2xl font-bold text-[#1B1A17]">
          ${escapeHtml(artwork.title)}
        </h1>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-white border border-[#E8E3D7] p-4">
        <div><span class="text-[#8F887D] block mb-0.5">관람 장소</span><strong>${escapeHtml(artwork.location) || '기록 없음'}</strong></div>
        <div><span class="text-[#8F887D] block mb-0.5">관람 일자</span><strong>${escapeHtml(artwork.viewDate) || '기록 없음'}</strong></div>
        <div><span class="text-[#8F887D] block mb-0.5">개인 평점</span><span class="font-serif text-[#5C1D24] tracking-widest text-sm">${stars}</span></div>
      </div>

      ${artwork.notes ? `
        <div class="space-y-1">
          <div class="text-[11px] font-serifEn tracking-widest text-[#8F887D] uppercase font-semibold">My Personal Reflection</div>
          <div class="text-xs sm:text-sm text-[#2E2C28] leading-relaxed bg-[#FAF7F0] p-4 border-l-2 border-[#5C1D24]">
            ${escapeHtml(artwork.notes)}
          </div>
        </div>
      ` : ''}

      ${reportSection}
    `;

    elements.modalDetail.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
  }

  // 11. 이벤트 리스너 설정
  function setupEventListeners() {
    // 탭 전환
    elements.navAnalysis.addEventListener('click', () => switchTab('analysis'));
    elements.navArchive.addEventListener('click', () => switchTab('archive'));
    elements.navAnalysisMobile?.addEventListener('click', () => switchTab('analysis'));
    elements.navArchiveMobile?.addEventListener('click', () => switchTab('archive'));

    // API Key 모달 제어
    elements.btnOpenApiKey.addEventListener('click', () => {
      elements.inputGeminiApiKey.value = ArtAiDocent.getApiKey();
      elements.modalApiKey.classList.remove('hidden');
    });
    elements.btnCloseApiKey.addEventListener('click', () => {
      elements.modalApiKey.classList.add('hidden');
    });
    elements.btnSaveApiKey.addEventListener('click', () => {
      const val = elements.inputGeminiApiKey.value.trim();
      if (!val) {
        alert('API 키를 입력해주세요.');
        return;
      }
      ArtAiDocent.setApiKey(val);
      updateApiKeyStatusUI();
      elements.modalApiKey.classList.add('hidden');
      alert('Gemini API 키가 저장되었습니다.');
    });
    elements.btnDeleteApiKey.addEventListener('click', () => {
      if (confirm('저장된 API 키를 삭제하시겠습니까?')) {
        ArtAiDocent.setApiKey('');
        elements.inputGeminiApiKey.value = '';
        updateApiKeyStatusUI();
        elements.modalApiKey.classList.add('hidden');
      }
    });

    // 메인 이미지 업로드 (파일 선택 및 드래그앤드롭)
    elements.analysisDropzone.addEventListener('click', () => elements.analysisMainImageInput.click());
    elements.analysisMainImageInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        const optimized = await optimizeImage(e.target.files[0]);
        state.mainImageDataUrl = optimized;
        elements.analysisMainPreviewImg.src = optimized;
        elements.analysisDropzone.classList.add('hidden');
        elements.analysisMainPreviewBox.classList.remove('hidden');
      }
    });

    elements.analysisDropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      elements.analysisDropzone.classList.add('border-[#5C1D24]', 'bg-[#F2ECE5]');
    });
    elements.analysisDropzone.addEventListener('dragleave', () => {
      elements.analysisDropzone.classList.remove('border-[#5C1D24]', 'bg-[#F2ECE5]');
    });
    elements.analysisDropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      elements.analysisDropzone.classList.remove('border-[#5C1D24]', 'bg-[#F2ECE5]');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const optimized = await optimizeImage(e.dataTransfer.files[0]);
        state.mainImageDataUrl = optimized;
        elements.analysisMainPreviewImg.src = optimized;
        elements.analysisDropzone.classList.add('hidden');
        elements.analysisMainPreviewBox.classList.remove('hidden');
      }
    });

    elements.btnRemoveMainImg.addEventListener('click', () => {
      state.mainImageDataUrl = null;
      elements.analysisMainPreviewImg.src = '';
      elements.analysisMainPreviewBox.classList.add('hidden');
      elements.analysisDropzone.classList.remove('hidden');
    });

    // 라벨 이미지 첨부
    elements.btnTriggerLabelUpload.addEventListener('click', () => elements.analysisLabelImageInput.click());
    elements.analysisLabelImageInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        const opt = await optimizeImage(e.target.files[0], 1200, 0.8);
        state.labelImageDataUrl = opt;
        elements.labelImageStatus.textContent = e.target.files[0].name;
        elements.btnRemoveLabelImg.classList.remove('hidden');
      }
    });
    elements.btnRemoveLabelImg.addEventListener('click', () => {
      state.labelImageDataUrl = null;
      elements.analysisLabelImageInput.value = '';
      elements.labelImageStatus.textContent = '첨부된 라벨 없음';
      elements.btnRemoveLabelImg.classList.add('hidden');
    });

    // [AI 도슨트 심층 분석 시작] 버튼
    elements.btnStartAnalysis.addEventListener('click', startAnalysis);

    // [다른 작품 분석하기] 리셋 버튼
    elements.btnResultReset.addEventListener('click', () => {
      if (confirm('현재 분석 화면을 닫고 새로운 작품을 분석하시겠습니까?')) {
        state.mainImageDataUrl = null;
        state.labelImageDataUrl = null;
        state.currentAnalysisResult = null;
        elements.analysisAuthorNotes.value = '';
        elements.analysisMainPreviewImg.src = '';
        elements.analysisMainPreviewBox.classList.add('hidden');
        elements.analysisDropzone.classList.remove('hidden');
        elements.analysisResultView.classList.add('hidden');
        elements.analysisInputContainer.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    // 분석 결과 화면에서 PDF 출력
    elements.btnResultExportPdf.addEventListener('click', async () => {
      if (!state.currentAnalysisResult || !state.mainImageDataUrl) return;
      const fakeArtwork = {
        title: elements.archiveSaveTitle.value || state.currentAnalysisResult.suggestedTitle,
        artist: elements.archiveSaveArtist.value || state.currentAnalysisResult.suggestedArtist,
        location: elements.archiveSaveLocation.value,
        viewDate: elements.archiveSaveDate.value,
        rating: state.saveRating,
        notes: elements.archiveSaveNotes.value,
        image: state.mainImageDataUrl,
        analysisReport: state.currentAnalysisResult
      };
      await ArtPdfExporter.exportArtworkCatalog(fakeArtwork);
    });

    // [아카이브에 저장하기] 버튼
    elements.btnConfirmSaveArchive.addEventListener('click', saveAnalysisToArchive);

    // 아카이브 상세 모달 닫기
    elements.btnCloseDetail.addEventListener('click', () => {
      elements.modalDetail.classList.add('hidden');
      document.body.style.overflow = '';
    });

    // 상세 모달에서 PDF 출력
    elements.btnDetailExportPdf.addEventListener('click', async () => {
      if (state.selectedArtwork) {
        await ArtPdfExporter.exportArtworkCatalog(state.selectedArtwork);
      }
    });

    // 상세 모달에서 삭제
    elements.btnDetailDelete.addEventListener('click', async () => {
      if (!state.selectedArtwork) return;
      if (confirm('이 작품과 분석 리포트를 보관함에서 삭제하시겠습니까?')) {
        await ArtStorage.deleteArtwork(state.selectedArtwork.id);
        elements.modalDetail.classList.add('hidden');
        document.body.style.overflow = '';
        await loadArchive();
      }
    });

    // 상세 모달에서 수정 (간단 프롬프트 수정)
    elements.btnDetailEdit.addEventListener('click', async () => {
      if (!state.selectedArtwork) return;
      const newTitle = prompt('작품명을 입력하세요:', state.selectedArtwork.title);
      if (newTitle === null) return;
      const newArtist = prompt('작가명을 입력하세요:', state.selectedArtwork.artist);
      if (newArtist === null) return;
      const newNotes = prompt('개인 감상 메모를 수정하세요:', state.selectedArtwork.notes);
      if (newNotes === null) return;

      await ArtStorage.updateArtwork(state.selectedArtwork.id, {
        title: newTitle,
        artist: newArtist,
        notes: newNotes
      });
      openDetailModal(state.selectedArtwork.id);
      await loadArchive();
    });

    // 검색 및 필터
    let timer;
    elements.searchInput.addEventListener('input', (e) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.searchKeyword = e.target.value;
        loadArchive();
      }, 250);
    });

    elements.ratingFilterSelect.addEventListener('change', (e) => {
      state.ratingFilter = Number(e.target.value);
      loadArchive();
    });

    elements.sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      loadArchive();
    });

    // 배경 클릭 시 모달 닫기
    [elements.modalApiKey, elements.modalDetail].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
          document.body.style.overflow = '';
        }
      });
    });
  }

  // HTML escape
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  init();
});
