/**
 * ART INSIGHT — IndexedDB Storage Layer (Dexie.js)
 * AI 분석 리포트 및 아카이브 영구 저장 모듈
 */

const DB_NAME = 'ArtInsightDB';
const DB_VERSION = 2;

// Dexie 인스턴스 초기화
const db = new Dexie(DB_NAME);

db.version(DB_VERSION).stores({
  artworks: '++id, title, artist, location, viewDate, rating, createdAt, updatedAt'
});

const ArtStorage = {
  // 모든 작품 조회 (최신 등록순)
  async getAllArtworks() {
    return await db.artworks.orderBy('createdAt').reverse().toArray();
  },

  // 특정 작품 조회
  async getArtworkById(id) {
    return await db.artworks.get(Number(id));
  },

  // 새 작품 및 AI 분석 리포트 등록
  async addArtwork(artworkData) {
    const now = new Date().toISOString();
    const newEntry = {
      title: (artworkData.title && artworkData.title.trim()) || '제목 미상 (Untitled)',
      artist: (artworkData.artist && artworkData.artist.trim()) || '작가 미상 (Unknown)',
      location: artworkData.location || '',
      viewDate: artworkData.viewDate || new Date().toISOString().slice(0, 10),
      rating: Number(artworkData.rating) || 0,
      notes: artworkData.notes || '',
      image: artworkData.image || '', // Base64
      labelImage: artworkData.labelImage || null,
      authorNotes: artworkData.authorNotes || '',
      analysisReport: artworkData.analysisReport || null, // AI 심층 분석 결과 전체 JSON
      tags: artworkData.tags || [],
      createdAt: now,
      updatedAt: now
    };
    const id = await db.artworks.add(newEntry);
    return { ...newEntry, id };
  },

  // 작품 정보 및 감상 수정
  async updateArtwork(id, updatedFields) {
    const now = new Date().toISOString();
    const updatePayload = {
      ...updatedFields,
      updatedAt: now
    };
    if (updatePayload.title !== undefined) {
      updatePayload.title = updatePayload.title.trim() || '제목 미상 (Untitled)';
    }
    if (updatePayload.artist !== undefined) {
      updatePayload.artist = updatePayload.artist.trim() || '작가 미상 (Unknown)';
    }
    if (updatePayload.rating !== undefined) {
      updatePayload.rating = Number(updatePayload.rating) || 0;
    }
    await db.artworks.update(Number(id), updatePayload);
    return await this.getArtworkById(id);
  },

  // 작품 삭제
  async deleteArtwork(id) {
    return await db.artworks.delete(Number(id));
  },

  // 검색 및 필터링
  async searchArtworks(keyword = '', filterRating = 0, sortBy = 'latest') {
    let collection = await this.getAllArtworks();

    // 키워드 검색
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      collection = collection.filter(item => {
        const titleMatch = item.title && item.title.toLowerCase().includes(q);
        const artistMatch = item.artist && item.artist.toLowerCase().includes(q);
        const locMatch = item.location && item.location.toLowerCase().includes(q);
        const notesMatch = item.notes && item.notes.toLowerCase().includes(q);
        
        // AI 분석 내용 안에서도 검색 지원
        let reportMatch = false;
        if (item.analysisReport) {
          const r = item.analysisReport;
          const impression = r.firstImpression || r.docentVoice || '';
          const movements = r.artHistoricalContext?.movements?.join(' ') || '';
          const narrative = r.artHistoricalContext?.narrative || '';
          reportMatch = impression.toLowerCase().includes(q) || 
                        movements.toLowerCase().includes(q) || 
                        narrative.toLowerCase().includes(q);
        }

        return titleMatch || artistMatch || locMatch || notesMatch || reportMatch;
      });
    }

    // 별점 필터
    if (filterRating > 0) {
      collection = collection.filter(item => item.rating >= filterRating);
    }

    // 정렬
    if (sortBy === 'rating') {
      collection.sort((a, b) => b.rating - a.rating || new Date(b.viewDate) - new Date(a.viewDate));
    } else if (sortBy === 'date') {
      collection.sort((a, b) => new Date(b.viewDate) - new Date(a.viewDate));
    } else {
      collection.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return collection;
  },

  // 아카이브 전체 데이터 백업 파일 내보내기 (JSON 다운로드)
  async exportBackup() {
    const all = await db.artworks.toArray();
    const dataStr = JSON.stringify({
      version: 'ART_INSIGHT_V3',
      exportedAt: new Date().toISOString(),
      artworksCount: all.length,
      artworks: all
    }, null, 2);

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `art_insight_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return all.length;
  },

  // 백업 파일 불러오기 (JSON 복원)
  async importBackup(jsonString) {
    const data = JSON.parse(jsonString);
    if (!data || !Array.isArray(data.artworks)) {
      throw new Error('올바른 ART INSIGHT 백업 JSON 파일 형식이 아닙니다.');
    }

    let addedCount = 0;
    for (const item of data.artworks) {
      const { id, ...cleanItem } = item;
      await db.artworks.add(cleanItem);
      addedCount++;
    }
    return addedCount;
  }
};

window.ArtStorage = ArtStorage;
