/**
 * ART INSIGHT — Main Application Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Lucide 아이콘 초기화
  lucide.createIcons();

  // 앱 상태
  const state = {
    currentTab: 'archive', // 'discover' | 'archive'
    artworks: [],
    selectedArtwork: null,
    searchKeyword: '',
    ratingFilter: 0,
    sortBy: 'latest',
    newEntryImage: null,
    newEntryRating: 0,
    editRating: 0
  };

  // DOM 요소 캐싱
  const elements = {
    // 탭 및 뷰
    navDiscover: document.getElementById('nav-discover'),
    navArchive: document.getElementById('nav-archive'),
    navDiscoverMobile: document.getElementById('nav-discover-mobile'),
    navArchiveMobile: document.getElementById('nav-archive-mobile'),
    viewDiscover: document.getElementById('view-discover'),
    viewArchive: document.getElementById('view-archive'),

    // 아카이브 요소
    archiveGrid: document.getElementById('archive-grid'),
    emptyState: document.getElementById('empty-state'),
    searchInput: document.getElementById('search-input'),
    ratingFilterSelect: document.getElementById('rating-filter'),
    sortSelect: document.getElementById('sort-select'),
    totalCountBadge: document.getElementById('total-count-badge'),

    // 작품 등록 모달
    btnOpenCreate: document.getElementById('btn-open-create'),
    btnOpenCreateMobile: document.getElementById('btn-open-create-mobile'),
    modalCreate: document.getElementById('modal-create'),
    btnCloseCreate: document.getElementById('btn-close-create'),
    formCreate: document.getElementById('form-create'),
    inputImage: document.getElementById('input-image'),
    dropZone: document.getElementById('drop-zone'),
    previewContainer: document.getElementById('preview-container'),
    previewImage: document.getElementById('preview-image'),
    btnRemoveImage: document.getElementById('btn-remove-image'),
    createStarContainer: document.getElementById('create-star-rating'),

    // 작품 상세 모달
    modalDetail: document.getElementById('modal-detail'),
    btnCloseDetail: document.getElementById('btn-close-detail'),
    detailImage: document.getElementById('detail-image'),
    detailTitle: document.getElementById('detail-title'),
    detailArtist: document.getElementById('detail-artist'),
    detailLocation: document.getElementById('detail-location'),
    detailDate: document.getElementById('detail-date'),
    detailRating: document.getElementById('detail-rating'),
    detailNotes: document.getElementById('detail-notes'),
    btnExportPdf: document.getElementById('btn-export-pdf'),
    btnEditArtwork: document.getElementById('btn-edit-artwork'),
    btnDeleteArtwork: document.getElementById('btn-delete-artwork'),

    // 작품 수정 모달
    modalEdit: document.getElementById('modal-edit'),
    btnCloseEdit: document.getElementById('btn-close-edit'),
    formEdit: document.getElementById('form-edit'),
    editTitle: document.getElementById('edit-title'),
    editArtist: document.getElementById('edit-artist'),
    editLocation: document.getElementById('edit-location'),
    editDate: document.getElementById('edit-date'),
    editNotes: document.getElementById('edit-notes'),
    editStarContainer: document.getElementById('edit-star-rating')
  };

  // 1. 초기 데이터 로드 및 샘플 시딩 (비어있을 때 명화 1점 안내용)
  async function initApp() {
    let artworks = await ArtStorage.getAllArtworks();
    if (artworks.length === 0) {
      await seedSampleData();
      artworks = await ArtStorage.getAllArtworks();
    }
    state.artworks = artworks;
    renderArchive();
    setupEventListeners();
  }

  // 초기 안내용 샘플 데이터 (빈 화면 방지)
  async function seedSampleData() {
    const sampleArtwork = {
      title: '밤의 카페 테라스 (Café Terrace at Night)',
      artist: '빈센트 반 고흐 (Vincent van Gogh)',
      location: '오르세 미술관 특별전',
      viewDate: new Date().toISOString().slice(0, 10),
      rating: 5,
      notes: '검은색을 전혀 쓰지 않고도 밤하늘의 짙은 어둠과 황홀한 별빛을 표현해낸 강렬한 노란색과 짙은 코발트 블루의 대조가 가슴을 뭉클하게 한다. 테라스의 따스한 가스등 아래 모여 있는 사람들의 모습에서 쓸쓸함 속의 온기가 느껴진다.',
      image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80',
      createdAt: new Date().toISOString()
    };
    await ArtStorage.addArtwork(sampleArtwork);
  }

  // 2. 탭 전환
  function switchTab(tab) {
    state.currentTab = tab;
    if (tab === 'discover') {
      elements.viewDiscover.classList.remove('hidden');
      elements.viewArchive.classList.add('hidden');
      
      elements.navDiscover.classList.add('text-burgundy', 'border-b-2', 'border-burgundy');
      elements.navArchive.classList.remove('text-burgundy', 'border-b-2', 'border-burgundy');
      
      elements.navDiscoverMobile?.classList.add('text-burgundy');
      elements.navArchiveMobile?.classList.remove('text-burgundy');
    } else {
      elements.viewDiscover.classList.add('hidden');
      elements.viewArchive.classList.remove('hidden');
      
      elements.navArchive.classList.add('text-burgundy', 'border-b-2', 'border-burgundy');
      elements.navDiscover.classList.remove('text-burgundy', 'border-b-2', 'border-burgundy');

      elements.navArchiveMobile?.classList.add('text-burgundy');
      elements.navDiscoverMobile?.classList.remove('text-burgundy');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    lucide.createIcons();
  }

  // 3. 아카이브 렌더링
  async function renderArchive() {
    const artworks = await ArtStorage.searchArtworks(
      state.searchKeyword,
      state.ratingFilter,
      state.sortBy
    );
    state.artworks = artworks;

    // 카운트 배지 갱신
    if (elements.totalCountBadge) {
      elements.totalCountBadge.textContent = `${artworks.length}개 작품`;
    }

    if (artworks.length === 0) {
      elements.archiveGrid.innerHTML = '';
      elements.emptyState.classList.remove('hidden');
      return;
    }

    elements.emptyState.classList.add('hidden');
    elements.archiveGrid.innerHTML = artworks.map(item => createArtworkCardHtml(item)).join('');
    lucide.createIcons();

    // 카드 클릭 이벤트 바인딩
    document.querySelectorAll('.artwork-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.id;
        openDetailModal(id);
      });
    });
  }

  // 아카이브 카드 템플릿 (에디토리얼 도록 감성)
  function createArtworkCardHtml(item) {
    const stars = '★'.repeat(item.rating || 0) + '☆'.repeat(5 - (item.rating || 0));
    const title = item.title || '제목 미상';
    const artist = item.artist || '작가 미상';
    const location = item.location ? `<span class="truncate">${escapeHtml(item.location)}</span>` : '';
    const date = item.viewDate ? `<span>${escapeHtml(item.viewDate)}</span>` : '';

    return `
      <article class="artwork-card group cursor-pointer bg-white border border-[#E8E4DC] rounded-none overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col" data-id="${item.id}">
        <!-- Image Frame -->
        <div class="relative w-full aspect-[4/5] bg-[#F4F1EA] overflow-hidden flex items-center justify-center p-3">
          <img 
            src="${item.image}" 
            alt="${escapeHtml(title)}" 
            class="w-full h-full object-contain transition-transform duration-500 group-hover:scale-102"
            loading="lazy"
          />
          <div class="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[11px] font-serif text-[#5C1D24] tracking-widest border border-[#E2DDD3]">
            ${stars}
          </div>
        </div>

        <!-- Info Area -->
        <div class="p-5 flex-1 flex flex-col justify-between bg-white border-t border-[#EAE6DE]">
          <div>
            <div class="text-[11px] font-serif tracking-[0.16em] uppercase text-[#722F37] mb-1 font-semibold truncate">
              ${escapeHtml(artist)}
            </div>
            <h3 class="font-serif-kr text-[17px] font-semibold text-[#1F1E1C] line-clamp-1 mb-2 tracking-tight group-hover:text-[#5C1D24] transition-colors">
              ${escapeHtml(title)}
            </h3>
            ${item.notes ? `
              <p class="text-[12.5px] text-[#696359] line-clamp-2 leading-relaxed font-sans mb-3 font-light">
                ${escapeHtml(item.notes)}
              </p>
            ` : ''}
          </div>

          <div class="pt-3 border-t border-[#F2EFE8] flex items-center justify-between text-[11px] text-[#8E877C]">
            <div class="flex items-center gap-1.5 truncate">
              <i data-lucide="map-pin" class="w-3 h-3 text-[#B0A799] shrink-0"></i>
              ${location || '장소 미입력'}
            </div>
            <div class="shrink-0 text-[10.5px]">
              ${date}
            </div>
          </div>
        </div>
      </article>
    `;
  }

  // 4. 작품 등록 모달 제어
  function openCreateModal() {
    resetCreateForm();
    elements.modalCreate.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
  }

  function closeCreateModal() {
    elements.modalCreate.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function resetCreateForm() {
    elements.formCreate.reset();
    state.newEntryImage = null;
    state.newEntryRating = 0;
    updateStarUI(elements.createStarContainer, 0);
    elements.previewContainer.classList.add('hidden');
    elements.dropZone.classList.remove('hidden');
    elements.previewImage.src = '';
    
    // 오늘 날짜 기본 지정
    const dateInput = document.getElementById('create-date');
    if (dateInput) {
      dateInput.value = new Date().toISOString().slice(0, 10);
    }
  }

  // 5. 이미지 압축 및 로드 처리 (고용량 모바일 사진을 IndexedDB에 최적화된 1600px 품질 0.85로 리사이즈)
  function handleImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('올바른 이미지 파일을 선택해주세요.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1600;
        const MAX_HEIGHT = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.85);
        state.newEntryImage = optimizedBase64;

        elements.previewImage.src = optimizedBase64;
        elements.dropZone.classList.add('hidden');
        elements.previewContainer.classList.remove('hidden');
        lucide.createIcons();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  // 6. 별점 UI 컴포넌트 헬퍼
  function setupStarRating(container, onSelect) {
    container.innerHTML = [1, 2, 3, 4, 5].map(val => `
      <button type="button" class="star-btn" data-value="${val}">
        ★
      </button>
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

  // 7. 작품 상세 모달 열기
  async function openDetailModal(id) {
    const artwork = await ArtStorage.getArtworkById(id);
    if (!artwork) return;
    state.selectedArtwork = artwork;

    elements.detailImage.src = artwork.image;
    elements.detailTitle.textContent = artwork.title || '제목 미상';
    elements.detailArtist.textContent = artwork.artist || '작가 미상';
    elements.detailLocation.textContent = artwork.location || '기록된 관람 장소 없음';
    elements.detailDate.textContent = artwork.viewDate || '날짜 미상';
    
    const stars = '★'.repeat(artwork.rating || 0) + '☆'.repeat(5 - (artwork.rating || 0));
    elements.detailRating.textContent = stars;
    
    elements.detailNotes.textContent = artwork.notes || '기록된 감상 메모가 없습니다. 훗날 다시 이 작품을 마주했을 때 전해지는 울림을 기록해보세요.';

    elements.modalDetail.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    lucide.createIcons();
  }

  function closeDetailModal() {
    elements.modalDetail.classList.add('hidden');
    document.body.style.overflow = '';
  }

  // 8. 작품 수정 모달 열기
  function openEditModal() {
    if (!state.selectedArtwork) return;
    const a = state.selectedArtwork;
    elements.editTitle.value = a.title === '제목 미상 (Untitled)' ? '' : a.title;
    elements.editArtist.value = a.artist === '작가 미상 (Unknown)' ? '' : a.artist;
    elements.editLocation.value = a.location || '';
    elements.editDate.value = a.viewDate || '';
    elements.editNotes.value = a.notes || '';
    state.editRating = a.rating || 0;
    updateStarUI(elements.editStarContainer, state.editRating);

    elements.modalEdit.classList.remove('hidden');
    lucide.createIcons();
  }

  function closeEditModal() {
    elements.modalEdit.classList.add('hidden');
  }

  // 9. 이벤트 리스너 바인딩
  function setupEventListeners() {
    // 탭 전환
    elements.navDiscover.addEventListener('click', () => switchTab('discover'));
    elements.navArchive.addEventListener('click', () => switchTab('archive'));
    elements.navDiscoverMobile?.addEventListener('click', () => switchTab('discover'));
    elements.navArchiveMobile?.addEventListener('click', () => switchTab('archive'));

    // Discover 페이지 내 바로가기 버튼들
    const heroExploreBtn = document.getElementById('btn-hero-explore');
    if (heroExploreBtn) {
      heroExploreBtn.addEventListener('click', () => switchTab('archive'));
    }

    // 모달 열기/닫기
    elements.btnOpenCreate.addEventListener('click', openCreateModal);
    elements.btnOpenCreateMobile?.addEventListener('click', openCreateModal);
    elements.btnCloseCreate.addEventListener('click', closeCreateModal);
    elements.btnCloseDetail.addEventListener('click', closeDetailModal);
    elements.btnCloseEdit.addEventListener('click', closeEditModal);

    // 모달 배경 클릭 시 닫기
    [elements.modalCreate, elements.modalDetail, elements.modalEdit].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
          document.body.style.overflow = '';
        }
      });
    });

    // 별점 바인딩
    setupStarRating(elements.createStarContainer, (r) => { state.newEntryRating = r; });
    setupStarRating(elements.editStarContainer, (r) => { state.editRating = r; });

    // 이미지 업로드 (파일 선택 및 드래그앤드롭)
    elements.dropZone.addEventListener('click', () => elements.inputImage.click());
    elements.inputImage.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleImageUpload(e.target.files[0]);
      }
    });

    elements.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      elements.dropZone.classList.add('border-burgundy', 'bg-[#F2ECE5]');
    });
    elements.dropZone.addEventListener('dragleave', () => {
      elements.dropZone.classList.remove('border-burgundy', 'bg-[#F2ECE5]');
    });
    elements.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      elements.dropZone.classList.remove('border-burgundy', 'bg-[#F2ECE5]');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleImageUpload(e.dataTransfer.files[0]);
      }
    });

    elements.btnRemoveImage.addEventListener('click', () => {
      state.newEntryImage = null;
      elements.previewImage.src = '';
      elements.previewContainer.classList.add('hidden');
      elements.dropZone.classList.remove('hidden');
    });

    // 작품 등록 제출
    elements.formCreate.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!state.newEntryImage) {
        alert('작품 사진을 등록해주세요.');
        return;
      }

      const titleInput = document.getElementById('create-title').value;
      const artistInput = document.getElementById('create-artist').value;
      const locationInput = document.getElementById('create-location').value;
      const dateInput = document.getElementById('create-date').value;
      const notesInput = document.getElementById('create-notes').value;

      const newEntry = {
        title: titleInput,
        artist: artistInput,
        location: locationInput,
        viewDate: dateInput,
        rating: state.newEntryRating,
        notes: notesInput,
        image: state.newEntryImage
      };

      try {
        await ArtStorage.addArtwork(newEntry);
        closeCreateModal();
        switchTab('archive');
        await renderArchive();
      } catch (err) {
        console.error('작품 저장 실패:', err);
        alert('작품 저장에 실패했습니다. 다시 시도해주세요.');
      }
    });

    // 작품 수정 제출
    elements.formEdit.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.selectedArtwork) return;

      const updated = {
        title: elements.editTitle.value,
        artist: elements.editArtist.value,
        location: elements.editLocation.value,
        viewDate: elements.editDate.value,
        notes: elements.editNotes.value,
        rating: state.editRating
      };

      try {
        const refreshed = await ArtStorage.updateArtwork(state.selectedArtwork.id, updated);
        state.selectedArtwork = refreshed;
        closeEditModal();
        openDetailModal(refreshed.id);
        await renderArchive();
      } catch (err) {
        console.error('수정 실패:', err);
        alert('수정에 실패했습니다.');
      }
    });

    // 작품 수정 버튼
    elements.btnEditArtwork.addEventListener('click', openEditModal);

    // 작품 삭제 버튼
    elements.btnDeleteArtwork.addEventListener('click', async () => {
      if (!state.selectedArtwork) return;
      if (confirm('이 작품 기록을 아카이브에서 정말 삭제하시겠습니까?')) {
        await ArtStorage.deleteArtwork(state.selectedArtwork.id);
        closeDetailModal();
        await renderArchive();
      }
    });

    // PDF 내보내기 버튼
    elements.btnExportPdf.addEventListener('click', async () => {
      if (!state.selectedArtwork) return;
      const btn = elements.btnExportPdf;
      const originalText = btn.innerHTML;
      btn.innerHTML = `<span class="inline-block animate-spin mr-1">⌛</span> 생성 중...`;
      btn.disabled = true;

      try {
        await ArtPdfExporter.exportArtworkCatalog(state.selectedArtwork);
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        lucide.createIcons();
      }
    });

    // 검색 및 필터 이벤트
    let debounceTimer;
    elements.searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        state.searchKeyword = e.target.value;
        renderArchive();
      }, 250);
    });

    elements.ratingFilterSelect.addEventListener('change', (e) => {
      state.ratingFilter = Number(e.target.value);
      renderArchive();
    });

    elements.sortSelect.addEventListener('change', (e) => {
      state.sortBy = e.target.value;
      renderArchive();
    });
  }

  // HTML escape 유틸리티
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // PWA Service Worker 등록 (지원 브라우저인 경우)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch((err) => {
        // file:// 프로토콜 등에서는 자동 스킵
        console.log('SW registration note:', err.message);
      });
    });
  }

  // 실행
  initApp();
});
