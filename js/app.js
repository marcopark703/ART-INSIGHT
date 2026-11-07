/**
 * ART INSIGHT — Core Application Controller
 * 현장 친화적 2단계 AI 도슨트: 초고속 퀵 도슨트(1~2초) + 선택적 심층 평론 엔진
 */

document.addEventListener('DOMContentLoaded', async () => {
  lucide.createIcons();

  // 앱 상태 관리
  const state = {
    currentTab: 'analysis', // 'analysis' | 'archive'
    mainImageDataUrl: null,
    labelImageDataUrl: null,
    currentAnalysisResult: null, // 퀵 도슨트 데이터 (심층 분석 시 머지됨)
    deepDocentResult: null,      // 심층 분석 데이터
    isDeepLoading: false,
    saveRating: 5,
    editRating: 5,
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
    btnOpenApiKeyMobile: document.getElementById('btn-open-api-key-mobile'),
    btnBannerOpenApiKey: document.getElementById('btn-banner-open-api-key'),
    modalApiKey: document.getElementById('modal-api-key'),
    btnCloseApiKey: document.getElementById('btn-close-api-key'),
    btnCancelApiKey: document.getElementById('btn-cancel-api-key'),
    inputGeminiApiKey: document.getElementById('input-gemini-api-key'),
    selectGeminiModel: document.getElementById('select-gemini-model'),
    inputCustomGeminiModel: document.getElementById('input-custom-gemini-model'),
    btnTestApiConnection: document.getElementById('btn-test-api-connection'),
    apiTestResultBox: document.getElementById('api-test-result-box'),
    btnSaveApiKey: document.getElementById('btn-save-api-key'),
    btnDeleteApiKey: document.getElementById('btn-delete-api-key'),
    apiStatusDot: document.getElementById('api-status-dot'),
    apiStatusLabel: document.getElementById('api-status-label'),
    bannerApiKeyWarning: document.getElementById('banner-api-key-warning'),

    // 에러 & 데모 안내 모달
    modalErrorHelp: document.getElementById('modal-error-help'),
    errorHelpTitle: document.getElementById('error-help-title'),
    errorHelpDesc: document.getElementById('error-help-desc'),
    btnActionOpenApiFromError: document.getElementById('btn-action-open-api-from-error'),
    btnActionTryDemo: document.getElementById('btn-action-try-demo'),
    btnCloseErrorHelp: document.getElementById('btn-close-error-help'),

    // 분석 입력 영역
    analysisInputContainer: document.getElementById('analysis-input-container'),
    analysisCameraInput: document.getElementById('analysis-camera-input'),
    analysisGalleryInput: document.getElementById('analysis-gallery-input'),
    analysisDropzoneWrapper: document.getElementById('analysis-dropzone-wrapper'),
    analysisDropzone: document.getElementById('analysis-dropzone'),
    analysisMainPreviewBox: document.getElementById('analysis-main-preview-box'),
    analysisMainPreviewImg: document.getElementById('analysis-main-preview-img'),
    compressionInfoText: document.getElementById('compression-info-text'),
    analysisCompressionBadge: document.getElementById('analysis-compression-badge'),
    btnRemoveMainImg: document.getElementById('btn-remove-main-img'),
    analysisAuthorNotes: document.getElementById('analysis-author-notes'),
    analysisLabelImageInput: document.getElementById('analysis-label-image-input'),
    labelImageStatus: document.getElementById('label-image-status'),
    btnRemoveLabelImg: document.getElementById('btn-remove-label-img'),
    btnStartAnalysis: document.getElementById('btn-start-analysis'),

    // 분석 로딩 영역
    analysisLoading: document.getElementById('analysis-loading'),
    loadingStageText: document.getElementById('loading-stage-text'),

    // 분석 결과 에디토리얼 리포트 영역
    analysisResultView: document.getElementById('analysis-result-view'),
    btnResultReset: document.getElementById('btn-result-reset'),
    resultDisplayImage: document.getElementById('result-display-image'),
    resultDisplayTitle: document.getElementById('result-display-title'),
    resultDisplayArtist: document.getElementById('result-display-artist'),

    // 1단계: 퀵 도슨트 카드 UI
    resultQuickArtstyle: document.getElementById('result-quick-artstyle'),
    resultQuickVoice: document.getElementById('result-quick-voice'),
    resultQuickPoint: document.getElementById('result-quick-point'),
    btnQuickNextPhoto: document.getElementById('btn-quick-next-photo'),
    btnQuickSaveScroll: document.getElementById('btn-quick-save-scroll'),
    btnToggleDeepAnalysis: document.getElementById('btn-toggle-deep-analysis'),
    btnToggleDeepText: document.getElementById('btn-toggle-deep-text'),

    // 2단계: 심층 평론 영역 (펼치기/접기)
    deepAnalysisSection: document.getElementById('deep-analysis-section'),
    btnResultExportPdf: document.getElementById('btn-result-export-pdf'),
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

    // 하단 아카이브 저장 폼
    archiveSaveSection: document.getElementById('archive-save-section'),
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
    btnBackupExport: document.getElementById('btn-backup-export'),
    inputBackupImport: document.getElementById('input-backup-import'),

    // 아카이브 상세 모달
    modalDetail: document.getElementById('modal-detail'),
    btnCloseDetail: document.getElementById('btn-close-detail'),
    btnDetailExportPdf: document.getElementById('btn-detail-export-pdf'),
    btnDetailEdit: document.getElementById('btn-detail-edit'),
    btnDetailDelete: document.getElementById('btn-detail-delete'),
    detailBodyContainer: document.getElementById('detail-body-container'),

    // 작품 정보 및 감상 수정 모달
    modalEditArtwork: document.getElementById('modal-edit-artwork'),
    btnCloseEditArtwork: document.getElementById('btn-close-edit-artwork'),
    btnCancelEditArtwork: document.getElementById('btn-cancel-edit-artwork'),
    btnSaveEditArtwork: document.getElementById('btn-save-edit-artwork'),
    editArtworkTitle: document.getElementById('edit-artwork-title'),
    editArtworkArtist: document.getElementById('edit-artwork-artist'),
    editArtworkLocation: document.getElementById('edit-artwork-location'),
    editArtworkDate: document.getElementById('edit-artwork-date'),
    editStarRating: document.getElementById('edit-star-rating'),
    editArtworkNotes: document.getElementById('edit-artwork-notes')
  };

  // 1. 앱 초기화
  async function init() {
    updateApiKeyStatusUI();
    setupStarRating(elements.saveStarRating, (r) => { state.saveRating = r; });
    
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
      if (elements.apiStatusLabel) elements.apiStatusLabel.textContent = 'AI 연결됨';
      elements.bannerApiKeyWarning.classList.add('hidden');
    } else {
      elements.apiStatusDot.className = 'w-2 h-2 rounded-full bg-amber-500 animate-pulse';
      if (elements.apiStatusLabel) elements.apiStatusLabel.textContent = 'API 키 설정 필요';
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

  // 4. 모바일/PC 고해상도 이미지 압축 및 데이터 낭비 방지 최적화 (1000px, 80% 압축으로 AI 비전 인식 최적화 및 업로드 지연 최소화)
  function optimizeImage(file, maxDimension = 1000, quality = 0.80) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) {
        return reject(new Error('이미지 파일(JPG, PNG 등)만 등록할 수 있습니다.'));
      }

      const originalSize = file.size; // 바이트 단위 원본 크기

      const reader = new FileReader();
      reader.onerror = () => reject(new Error('이미지 파일을 읽는 중 오류가 발생했습니다.'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('이미지 객체 생성에 실패했습니다.'));
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxDimension || height > maxDimension) {
              if (width > height) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              } else {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            const head = 'data:image/jpeg;base64,';
            const compressedBytes = Math.round((compressedDataUrl.length - head.length) * 3 / 4);

            const origMb = (originalSize / (1024 * 1024)).toFixed(1);
            const compKb = (compressedBytes / 1024).toFixed(0);
            const savedPct = Math.max(0, Math.round((1 - compressedBytes / originalSize) * 100));

            resolve({
              dataUrl: compressedDataUrl,
              stats: { origMb, compKb, savedPct, width, height }
            });
          } catch (err) {
            reject(err);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // 작품 메인 이미지 처리
  async function handleMainArtworkFile(file) {
    if (!file) return;
    try {
      if (elements.compressionInfoText) {
        elements.compressionInfoText.textContent = '고화질 이미지 최적화 압축 중...';
      }
      elements.analysisCompressionBadge?.classList.remove('hidden');

      const result = await optimizeImage(file, 1280, 0.82);
      state.mainImageDataUrl = result.dataUrl;

      elements.analysisMainPreviewImg.src = result.dataUrl;
      elements.analysisDropzoneWrapper.classList.add('hidden');
      elements.analysisMainPreviewBox.classList.remove('hidden');

      if (elements.compressionInfoText) {
        elements.compressionInfoText.textContent = `⚡ 스마트 압축 완료 (${result.stats.origMb}MB → ${result.stats.compKb}KB, 데이터 ${result.stats.savedPct}% 절약)`;
      }
    } catch (err) {
      console.error(err);
      alert('이미지 최적화 중 오류가 발생했습니다: ' + err.message);
    }
  }

  // 5. 별점 UI 헬퍼
  function setupStarRating(container, onSelect) {
    if (!container) return;
    container.innerHTML = [1, 2, 3, 4, 5].map(val => `
      <button type="button" class="star-btn cursor-pointer" data-value="${val}">★</button>
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
    if (!container) return;
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

  // 6. 에러 안내 모달 띄우기
  function showErrorHelp(title, desc) {
    elements.errorHelpTitle.textContent = title;
    elements.errorHelpDesc.textContent = desc;
    elements.modalErrorHelp.classList.remove('hidden');
    lucide.createIcons();
  }

  // 7. 1단계: 초고속 퀵 AI 도슨트 분석 실행 (1~2초)
  async function startAnalysis() {
    if (!state.mainImageDataUrl) {
      alert('분석할 작품 사진을 먼저 촬영하거나 선택해주세요.');
      return;
    }

    if (!ArtAiDocent.hasApiKey()) {
      showErrorHelp(
        'Gemini API 키가 등록되지 않았습니다',
        'ART INSIGHT의 실시간 AI 도슨트를 실행하려면 Google AI Studio의 무료 Gemini API 키가 필요합니다. 키를 등록하시거나, 아래 버튼을 눌러 체험용 도슨트로 즉시 확인해보실 수 있습니다.'
      );
      return;
    }

    // UI 전환: 로딩 상태
    elements.analysisInputContainer.classList.add('hidden');
    elements.analysisResultView.classList.add('hidden');
    elements.analysisLoading.classList.remove('hidden');
    elements.loadingStageText.textContent = '도슨트가 작품의 첫인상과 화풍을 짚어보고 있습니다 (약 1~2초)...';
    window.scrollTo({ top: 80, behavior: 'smooth' });

    try {
      const authorNotes = elements.analysisAuthorNotes.value.trim();
      const quickReport = await ArtAiDocent.analyzeQuickDocent({
        mainImageDataUrl: state.mainImageDataUrl,
        authorNotes: authorNotes
      });

      state.currentAnalysisResult = quickReport;
      state.deepDocentResult = null; // 심층 분석은 아직 수행되지 않음

      // 퀵 도슨트 카드 렌더링
      renderQuickDocentCard(quickReport);

      // 심층 평론 영역은 접힌 상태로 리셋
      elements.deepAnalysisSection.classList.add('hidden');
      elements.btnToggleDeepText.textContent = '📖 심층 평론 & 유사 작가 더보기';

      elements.analysisLoading.classList.add('hidden');
      elements.analysisResultView.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      lucide.createIcons();

    } catch (err) {
      elements.analysisLoading.classList.add('hidden');
      elements.analysisInputContainer.classList.remove('hidden');
      console.error('퀵 도슨트 분석 실패:', err);

      showErrorHelp(
        'AI 분석 연결 오류',
        `${err.message}\n\n* API 키의 철자를 확인하시거나, 아래 버튼을 눌러 체험용 도슨트로 바로 확인해보실 수 있습니다.`
      );
    }
  }

  // 퀵 도슨트 카드 렌더링
  function renderQuickDocentCard(quickData) {
    elements.resultDisplayImage.src = state.mainImageDataUrl;
    elements.resultDisplayTitle.textContent = quickData.suggestedTitle || '작품명 미상';
    elements.resultDisplayArtist.textContent = quickData.suggestedArtist || '작가 미상';
    elements.resultQuickArtstyle.textContent = `# ${quickData.artStyle || '화풍 분석'}`;
    elements.resultQuickVoice.textContent = quickData.docentVoice || '작품의 분위기를 감상해 보세요.';
    elements.resultQuickPoint.textContent = quickData.viewingPoint || '화면의 색채와 형태의 어우러짐을 주목해 보세요.';

    // 아카이브 폼 프리필
    elements.archiveSaveTitle.value = quickData.suggestedTitle || '';
    elements.archiveSaveArtist.value = quickData.suggestedArtist || '';
    state.saveRating = 5;
    updateStarUI(elements.saveStarRating, 5);
  }

  // 8. 2단계: 심층 도슨트 평론 요청 및 토글
  async function toggleDeepAnalysis() {
    const isHidden = elements.deepAnalysisSection.classList.contains('hidden');

    if (!isHidden) {
      // 이미 열려 있으면 접기
      elements.deepAnalysisSection.classList.add('hidden');
      elements.btnToggleDeepText.textContent = '📖 심층 평론 & 유사 작가 더보기';
      return;
    }

    // 이미 심층 분석 데이터가 있으면 펼치기만 함
    if (state.deepDocentResult) {
      elements.deepAnalysisSection.classList.remove('hidden');
      elements.btnToggleDeepText.textContent = '▲ 심층 평론 접기';
      elements.deepAnalysisSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      lucide.createIcons();
      return;
    }

    // 아직 심층 분석이 안 되어 있으면 AI 호출 실행
    if (state.isDeepLoading) return;
    state.isDeepLoading = true;
    const originalText = elements.btnToggleDeepText.textContent;
    elements.btnToggleDeepText.textContent = '⏳ 평론가가 심층 분석 중입니다 (약 3~4초)...';

    try {
      const authorNotes = elements.analysisAuthorNotes.value.trim();
      const deepReport = await ArtAiDocent.analyzeDeepDocent({
        mainImageDataUrl: state.mainImageDataUrl,
        quickData: state.currentAnalysisResult,
        authorNotes: authorNotes,
        labelText: ''
      });

      state.deepDocentResult = deepReport;
      // 전체 분석 결과 객체에 심층 내용 머지
      state.currentAnalysisResult = {
        ...state.currentAnalysisResult,
        ...deepReport
      };

      // 심층 뷰 렌더링
      renderDeepAnalysisView(deepReport);

      elements.deepAnalysisSection.classList.remove('hidden');
      elements.btnToggleDeepText.textContent = '▲ 심층 평론 접기';
      elements.deepAnalysisSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      lucide.createIcons();

    } catch (err) {
      console.error('심층 분석 호출 오류:', err);
      elements.btnToggleDeepText.textContent = originalText;
      alert('심층 분석 호출 중 오류가 발생했습니다: ' + err.message);
    } finally {
      state.isDeepLoading = false;
    }
  }

  // 심층 평론 뷰 렌더링
  function renderDeepAnalysisView(report) {
    // 미술사적 맥락
    const movements = report.artHistoricalContext?.movements || [];
    elements.resultMovementsTags.innerHTML = movements.map(m => `
      <span class="px-3 py-1 bg-[#F5EFE6] border border-[#E2DDD3] text-xs font-serifEn tracking-wider text-[#722F37] font-semibold">
        # ${escapeHtml(m)}
      </span>
    `).join('');
    elements.resultHistoricalNarrative.textContent = report.artHistoricalContext?.narrative || '';

    // 조형적 특징
    const fe = report.formalElements || {};
    elements.resultFormalColor.textContent = fe.color || '분석 중';
    elements.resultFormalComposition.textContent = fe.composition || '분석 중';
    elements.resultFormalForm.textContent = fe.form || '분석 중';
    elements.resultFormalTexture.textContent = fe.brushworkAndTexture || '분석 중';
    if (elements.resultFormalLight) elements.resultFormalLight.textContent = fe.lightAndShadow || '분석 중';

    // 유사 작가 3인
    const artists = report.similarArtists || [];
    elements.resultSimilarArtistsContainer.innerHTML = artists.map(a => `
      <div class="border border-[#EAE5DA] bg-[#FAF9F6] p-4 flex flex-col justify-between space-y-2.5">
        <div>
          <div class="text-[10px] font-serifEn tracking-widest text-[#722F37] uppercase font-bold">Similar Master</div>
          <h4 class="font-serifKr text-sm font-bold text-[#1B1A17] mt-0.5">${escapeHtml(a.name)}</h4>
          <p class="text-xs text-[#8F887D] font-light">${escapeHtml(a.artisticStyle)}</p>
        </div>
        <div class="space-y-1.5 text-xs text-[#3A352F] pt-2 border-t border-[#EFEBE4]">
          <div><strong class="text-[#5C1D24]">시각적 유사점:</strong> ${escapeHtml(a.similarities)}</div>
          <div><strong class="text-[#7A746B]">화풍의 차이점:</strong> ${escapeHtml(a.differences)}</div>
          <div class="pt-0.5 text-[11px] text-[#8F887D]"><strong>대표 참고작:</strong> ${escapeHtml(a.keyWork)}</div>
        </div>
      </div>
    `).join('');

    // 상징과 다각적 해석
    const interp = report.interpretation || {};
    elements.resultInterpSymbols.textContent = interp.symbolsAndThemes || '';
    elements.resultInterpPerspectives.textContent = interp.multiplePerspectives || '';

    // 작가 의도 vs AI 해석 비교
    if (elements.resultAuthorVsAi) {
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
          <div class="text-[#6B655B] italic text-xs">
            첨부된 작가 설명 자료가 없어 작가의 주관적 의도를 예단하지 않고, 작품 이미지에서 관찰되는 객관적인 시각 요소와 조형 질서에 집중하여 해석했습니다.
          </div>
        `;
      }
    }
  }

  // 9. 즉시 새 작품 스캔하기 (현장 연속 관람 플로우)
  function startNextScan() {
    state.mainImageDataUrl = null;
    state.labelImageDataUrl = null;
    state.currentAnalysisResult = null;
    state.deepDocentResult = null;

    if (elements.analysisCameraInput) elements.analysisCameraInput.value = '';
    if (elements.analysisGalleryInput) elements.analysisGalleryInput.value = '';
    elements.analysisAuthorNotes.value = '';
    elements.analysisMainPreviewImg.src = '';
    elements.analysisMainPreviewBox.classList.add('hidden');
    elements.analysisDropzoneWrapper.classList.remove('hidden');
    elements.deepAnalysisSection.classList.add('hidden');
    elements.analysisResultView.classList.add('hidden');
    elements.analysisInputContainer.classList.remove('hidden');

    window.scrollTo({ top: 0, behavior: 'smooth' });

    // 모바일인 경우 카메라 파일선택창 바로 트리거
    setTimeout(() => {
      if (elements.analysisCameraInput) {
        elements.analysisCameraInput.click();
      }
    }, 150);
  }

  // 10. 체험용 퀵 도슨트 실행 (API 키 없이도 즉시 경험)
  function runDemoReport() {
    elements.modalErrorHelp.classList.add('hidden');
    elements.analysisInputContainer.classList.add('hidden');
    elements.analysisLoading.classList.add('hidden');

    if (!state.mainImageDataUrl) {
      state.mainImageDataUrl = 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80';
    }

    const demoQuick = ArtAiDocent.generateSampleQuickDocent();
    const demoFull = ArtAiDocent.generateSampleDocentReport();

    state.currentAnalysisResult = demoQuick;
    state.deepDocentResult = demoFull; // 데모에서는 바로 펼쳐볼 수 있게 준비

    renderQuickDocentCard(demoQuick);
    renderDeepAnalysisView(demoFull);

    elements.deepAnalysisSection.classList.add('hidden');
    elements.btnToggleDeepText.textContent = '📖 심층 평론 & 유사 작가 더보기';

    elements.analysisResultView.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    lucide.createIcons();
  }

  // 11. 아카이브에 영구 저장하기
  async function saveAnalysisToArchive() {
    if (!state.mainImageDataUrl) return;

    const artworkData = {
      title: elements.archiveSaveTitle.value || '제목 미상',
      artist: elements.archiveSaveArtist.value || '작가 미상',
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

  // 12. 아카이브 목록 로드 및 렌더링
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
              AI Docent
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
            ${item.analysisReport?.docentVoice ? `
              <p class="text-xs text-[#5C1D24] line-clamp-2 leading-relaxed font-serifKr mb-2 bg-[#FAF7F0] p-2 border-l-2 border-[#5C1D24]">
                ${escapeHtml(item.analysisReport.docentVoice)}
              </p>
            ` : (item.notes ? `
              <p class="text-xs text-[#696359] line-clamp-2 leading-relaxed font-sans mb-3 font-light">
                ${escapeHtml(item.notes)}
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

    document.querySelectorAll('.artwork-card').forEach(card => {
      card.addEventListener('click', () => {
        openDetailModal(card.dataset.id);
      });
    });
  }

  // 13. 아카이브 상세 모달
  async function openDetailModal(id) {
    const artwork = await ArtStorage.getArtworkById(id);
    if (!artwork) return;
    state.selectedArtwork = artwork;

    const r = artwork.analysisReport;
    const stars = '★'.repeat(artwork.rating || 0) + '☆'.repeat(5 - (artwork.rating || 0));

    let reportSection = '';
    if (r) {
      reportSection = `
        <div class="border-t-2 border-[#5C1D24] pt-6 space-y-5">
          <div class="flex items-center justify-between">
            <div class="text-xs font-serifEn tracking-[0.2em] uppercase text-[#722F37] font-bold">
              AI Docent Curatorial Record
            </div>
            ${r.artStyle ? `
              <span class="text-xs font-serifKr bg-[#FAF4ED] text-[#5C1D24] px-2.5 py-0.5 border border-[#EADFCF]">
                # ${escapeHtml(r.artStyle)}
              </span>
            ` : ''}
          </div>

          <!-- Docent Voice -->
          ${r.docentVoice ? `
            <div class="space-y-1">
              <h4 class="font-serifKr text-xs font-bold text-[#5C1D24] flex items-center gap-1.5">
                <i data-lucide="sparkles" class="w-3.5 h-3.5"></i> 도슨트의 친절한 한마디
              </h4>
              <div class="text-xs sm:text-sm text-[#2E2C28] leading-relaxed bg-[#FAF8F3] p-4 whitespace-pre-line border-l-3 border-[#5C1D24]">
                ${escapeHtml(r.docentVoice)}
              </div>
            </div>
          ` : ''}

          <!-- Viewing Point -->
          ${r.viewingPoint ? `
            <div class="space-y-1">
              <h4 class="font-serifKr text-xs font-bold text-[#1B263B] flex items-center gap-1.5">
                <i data-lucide="eye" class="w-3.5 h-3.5"></i> 시각적 감상 팁
              </h4>
              <div class="text-xs sm:text-sm text-[#3A352F] leading-relaxed bg-[#F7F6F2] p-3.5 border-l-3 border-[#1B263B]">
                ${escapeHtml(r.viewingPoint)}
              </div>
            </div>
          ` : ''}

          <!-- Deep Historical Narrative (있는 경우만) -->
          ${r.artHistoricalContext?.narrative ? `
            <div class="space-y-1 pt-2">
              <h4 class="font-serifKr text-xs font-bold text-[#1B1A17]">[ 심층 미술사적 맥락 ]</h4>
              <div class="text-xs text-[#333] leading-relaxed bg-white border border-[#E8E3D7] p-3.5 whitespace-pre-line">
                ${escapeHtml(r.artHistoricalContext.narrative)}
              </div>
            </div>
          ` : ''}

          <!-- Similar Artists -->
          ${r.similarArtists?.length ? `
            <div class="space-y-1">
              <h4 class="font-serifKr text-xs font-bold text-[#1B1A17]">[ 유사 화풍의 작가 3인 ]</h4>
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
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
        </div>
      `;
    }

    elements.detailBodyContainer.innerHTML = `
      <div class="bg-[#F2ECE1] border border-[#E2DDD3] p-4 flex items-center justify-center">
        <img src="${artwork.image}" alt="${escapeHtml(artwork.title)}" class="max-h-[460px] w-auto max-w-full object-contain mx-auto shadow-md" />
      </div>

      <div class="border-b border-[#E8E3D7] pb-4">
        <div class="font-serifEn text-xs sm:text-sm tracking-[0.2em] uppercase text-[#722F37] font-semibold mb-1">
          ${escapeHtml(artwork.artist)}
        </div>
        <h1 class="font-serifKr text-xl sm:text-2xl font-bold text-[#1B1A17]">
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

  // 14. 이벤트 리스너 설정
  function setupEventListeners() {
    // 탭 전환
    elements.navAnalysis.addEventListener('click', () => switchTab('analysis'));
    elements.navArchive.addEventListener('click', () => switchTab('archive'));
    elements.navAnalysisMobile?.addEventListener('click', () => switchTab('analysis'));
    elements.navArchiveMobile?.addEventListener('click', () => switchTab('archive'));

    // API Key 모달 열기
    const openApiKeyModal = () => {
      elements.inputGeminiApiKey.value = ArtAiDocent.getApiKey();
      elements.apiTestResultBox.classList.add('hidden');
      
      const currentModel = ArtAiDocent.getSelectedModel();
      const standardModels = ['gemini-3.8-flash', 'gemini-3.6-flash'];
      
      if (standardModels.includes(currentModel)) {
        elements.selectGeminiModel.value = currentModel;
        elements.inputCustomGeminiModel.classList.add('hidden');
        elements.inputCustomGeminiModel.value = '';
      } else {
        elements.selectGeminiModel.value = 'custom';
        elements.inputCustomGeminiModel.classList.remove('hidden');
        elements.inputCustomGeminiModel.value = currentModel;
      }

      elements.modalApiKey.classList.remove('hidden');
      elements.modalErrorHelp.classList.add('hidden');
      lucide.createIcons();
    };

    // 실시간 지원 모델 조회 및 연결 테스트 버튼
    elements.btnTestApiConnection.addEventListener('click', async () => {
      const key = elements.inputGeminiApiKey.value.trim();
      if (!key) {
        alert('먼저 Gemini API 키를 입력해주세요.');
        elements.inputGeminiApiKey.focus();
        return;
      }

      const box = elements.apiTestResultBox;
      box.className = 'mt-2 p-2.5 text-[11px] border leading-relaxed bg-[#FAF9F6] text-[#666] border-[#D5CFC3]';
      box.textContent = '구글 서버와 연결하여 지원 모델 목록을 조회하는 중입니다...';
      box.classList.remove('hidden');

      try {
        const available = await ArtAiDocent.fetchAvailableModels(key);
        if (available.length === 0) {
          box.className = 'mt-2 p-2.5 text-[11px] border leading-relaxed bg-amber-50 text-amber-900 border-amber-200';
          box.textContent = '⚠️ API 키는 유효하지만 지원하는 모델 목록을 가져오지 못했습니다.';
          return;
        }

        elements.selectGeminiModel.innerHTML = available.map(m => `
          <option value="${m}">${m} ${m.includes('3.8') ? '(추천 / 최신)' : ''}</option>
        `).join('') + '<option value="custom">직접 모델명 입력...</option>';

        const bestModel = available.find(m => m.includes('3.8-flash')) || 
                          available.find(m => m.includes('3.6-flash')) || 
                          available.find(m => m.includes('flash')) || 
                          available[0];
        
        elements.selectGeminiModel.value = bestModel;
        elements.inputCustomGeminiModel.classList.add('hidden');

        box.className = 'mt-2 p-2.5 text-[11px] border leading-relaxed bg-emerald-50 text-emerald-900 border-emerald-200';
        box.innerHTML = `
          <strong>✅ 구글 서버 연결 성공!</strong><br/>
          사용 가능 모델: <span class="font-mono text-[10px] text-emerald-800">${available.slice(0, 5).join(', ')}...</span><br/>
          * 최적 Flash 모델 [<strong>${bestModel}</strong>]이 자동 지정되었습니다.
        `;
      } catch (err) {
        box.className = 'mt-2 p-2.5 text-[11px] border leading-relaxed bg-red-50 text-red-900 border-red-200';
        box.innerHTML = `
          <strong>❌ 구글 연결 실패:</strong> ${escapeHtml(err.message)}<br/>
          * API 키가 올바른지 Google AI Studio에서 확인해주세요.
        `;
      }
    });

    elements.selectGeminiModel.addEventListener('change', (e) => {
      if (e.target.value === 'custom') {
        elements.inputCustomGeminiModel.classList.remove('hidden');
        elements.inputCustomGeminiModel.focus();
      } else {
        elements.inputCustomGeminiModel.classList.add('hidden');
      }
    });

    elements.btnOpenApiKey.addEventListener('click', openApiKeyModal);
    elements.btnOpenApiKeyMobile?.addEventListener('click', openApiKeyModal);
    elements.btnBannerOpenApiKey?.addEventListener('click', openApiKeyModal);
    elements.btnActionOpenApiFromError?.addEventListener('click', openApiKeyModal);

    const closeApiKeyModal = () => {
      elements.modalApiKey.classList.add('hidden');
    };
    elements.btnCloseApiKey.addEventListener('click', closeApiKeyModal);
    elements.btnCancelApiKey.addEventListener('click', closeApiKeyModal);

    elements.btnSaveApiKey.addEventListener('click', () => {
      const val = elements.inputGeminiApiKey.value.trim();
      if (!val) {
        alert('API 키를 입력해주세요.');
        return;
      }

      let selectedModel = elements.selectGeminiModel.value;
      if (selectedModel === 'custom') {
        const customModel = elements.inputCustomGeminiModel.value.trim();
        selectedModel = customModel || 'gemini-3.8-flash';
      }

      ArtAiDocent.setApiKey(val);
      ArtAiDocent.setSelectedModel(selectedModel);

      updateApiKeyStatusUI();
      closeApiKeyModal();
      alert(`Gemini API 키와 모델([${selectedModel}])이 안전하게 등록되었습니다!`);
    });

    elements.btnDeleteApiKey.addEventListener('click', () => {
      if (confirm('저장된 API 키를 삭제하시겠습니까?')) {
        ArtAiDocent.setApiKey('');
        elements.inputGeminiApiKey.value = '';
        updateApiKeyStatusUI();
        closeApiKeyModal();
      }
    });

    // 에러 모달 내 데모 버튼 및 닫기
    elements.btnActionTryDemo.addEventListener('click', runDemoReport);
    elements.btnCloseErrorHelp.addEventListener('click', () => {
      elements.modalErrorHelp.classList.add('hidden');
    });

    // 카메라 직접 촬영 이벤트
    elements.analysisCameraInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        await handleMainArtworkFile(e.target.files[0]);
      }
    });

    // 갤러리/파일 보관함 선택 이벤트
    elements.analysisGalleryInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        await handleMainArtworkFile(e.target.files[0]);
      }
    });

    // PC 드래그 앤 드롭
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
        await handleMainArtworkFile(e.dataTransfer.files[0]);
      }
    });

    elements.btnRemoveMainImg.addEventListener('click', (e) => {
      e.stopPropagation();
      state.mainImageDataUrl = null;
      elements.analysisCameraInput.value = '';
      elements.analysisGalleryInput.value = '';
      elements.analysisMainPreviewImg.src = '';
      elements.analysisMainPreviewBox.classList.add('hidden');
      elements.analysisDropzoneWrapper.classList.remove('hidden');
    });

    // 라벨 이미지 첨부 이벤트
    elements.analysisLabelImageInput.addEventListener('change', async (e) => {
      if (e.target.files && e.target.files[0]) {
        try {
          const opt = await optimizeImage(e.target.files[0], 1200, 0.8);
          state.labelImageDataUrl = opt.dataUrl;
          elements.labelImageStatus.textContent = e.target.files[0].name;
          elements.btnRemoveLabelImg.classList.remove('hidden');
        } catch (err) {
          alert(err.message);
        }
      }
    });
    elements.btnRemoveLabelImg.addEventListener('click', (e) => {
      e.stopPropagation();
      state.labelImageDataUrl = null;
      elements.analysisLabelImageInput.value = '';
      elements.labelImageStatus.textContent = '첨부된 라벨 없음';
      elements.btnRemoveLabelImg.classList.add('hidden');
    });

    // [AI 도슨트 분석 시작] 버튼
    elements.btnStartAnalysis.addEventListener('click', startAnalysis);

    // [다른 작품 바로 스캔하기] 및 리셋 버튼
    elements.btnQuickNextPhoto?.addEventListener('click', startNextScan);
    elements.btnResultReset?.addEventListener('click', startNextScan);

    // [보관함에 저장하기] 스크롤 이동
    elements.btnQuickSaveScroll?.addEventListener('click', () => {
      elements.archiveSaveSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      elements.archiveSaveTitle?.focus();
    });

    // [심층 평론 & 유사 작가 더보기] 토글 버튼
    elements.btnToggleDeepAnalysis?.addEventListener('click', toggleDeepAnalysis);

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
      if (confirm('이 작품과 도슨트 기록을 보관함에서 삭제하시겠습니까?')) {
        await ArtStorage.deleteArtwork(state.selectedArtwork.id);
        elements.modalDetail.classList.add('hidden');
        document.body.style.overflow = '';
        await loadArchive();
      }
    });

    // 상세 모달에서 수정 모달 열기 (장소, 일자, 평점, 메모 모두 수정 지원)
    elements.btnDetailEdit.addEventListener('click', () => {
      if (!state.selectedArtwork) return;
      const a = state.selectedArtwork;
      elements.editArtworkTitle.value = a.title || '';
      elements.editArtworkArtist.value = a.artist || '';
      elements.editArtworkLocation.value = a.location || '';
      elements.editArtworkDate.value = a.viewDate || '';
      elements.editArtworkNotes.value = a.notes || '';
      state.editRating = Number(a.rating) || 5;

      setupStarRating(elements.editStarRating, (r) => { state.editRating = r; });
      updateStarUI(elements.editStarRating, state.editRating);

      elements.modalEditArtwork.classList.remove('hidden');
      lucide.createIcons();
    });

    // 수정 모달 닫기
    const closeEditModal = () => {
      elements.modalEditArtwork.classList.add('hidden');
    };
    elements.btnCloseEditArtwork.addEventListener('click', closeEditModal);
    elements.btnCancelEditArtwork.addEventListener('click', closeEditModal);

    // 수정 완료 저장
    elements.btnSaveEditArtwork.addEventListener('click', async () => {
      if (!state.selectedArtwork) return;
      const title = elements.editArtworkTitle.value.trim() || '제목 미상';
      const artist = elements.editArtworkArtist.value.trim() || '작가 미상';
      const location = elements.editArtworkLocation.value.trim();
      const viewDate = elements.editArtworkDate.value;
      const rating = state.editRating;
      const notes = elements.editArtworkNotes.value.trim();

      const updated = await ArtStorage.updateArtwork(state.selectedArtwork.id, {
        title,
        artist,
        location,
        viewDate,
        rating,
        notes
      });

      state.selectedArtwork = updated;
      closeEditModal();
      openDetailModal(updated.id);
      await loadArchive();
      alert('작품 정보 및 감상 기록이 성공적으로 수정되었습니다!');
    });

    // 전체 데이터 백업 파일 다운로드 (JSON)
    elements.btnBackupExport?.addEventListener('click', async () => {
      try {
        const count = await ArtStorage.exportBackup();
        alert(`소장 작품 ${count}개의 전체 분석 및 감상 기록이 백업 파일(.json)로 안전하게 다운로드되었습니다.\n\n* 다른 기기나 친구의 ART INSIGHT에서 [백업 복원]으로 그대로 불러올 수 있습니다.`);
      } catch (err) {
        alert('백업 다운로드 중 오류가 발생했습니다: ' + err.message);
      }
    });

    // 백업 파일 불러오기 및 복원 (JSON)
    elements.inputBackupImport?.addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!confirm('선택하신 백업 파일의 작품들을 현재 보관함으로 복원하시겠습니까?')) {
        e.target.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const added = await ArtStorage.importBackup(evt.target.result);
          alert(`성공적으로 ${added}개의 작품 데이터를 보관함에 복원했습니다!`);
          await loadArchive();
        } catch (err) {
          alert('백업 파일 복원에 실패했습니다: ' + err.message);
        } finally {
          e.target.value = '';
        }
      };
      reader.readAsText(file);
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
    [elements.modalApiKey, elements.modalErrorHelp, elements.modalDetail, elements.modalEditArtwork].forEach(modal => {
      modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
          document.body.style.overflow = '';
        }
      });
    });
  }

  // HTML escape 유틸
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
