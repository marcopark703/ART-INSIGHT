/**
 * ART INSIGHT — IndexedDB Storage Layer (Dexie.js)
 * 기기 내부 로컬 저장소 모듈
 */

const DB_NAME = 'ArtInsightDB';
const DB_VERSION = 1;

// Dexie 인스턴스 초기화
const db = new Dexie(DB_NAME);

db.version(DB_VERSION).stores({
  artworks: '++id, title, artist, location, viewDate, rating, createdAt, updatedAt'
});

// Artwork 저장소 헬퍼 함수들
const ArtStorage = {
  // 모든 작품 조회 (최신 등록순)
  async getAllArtworks() {
    return await db.artworks.orderBy('createdAt').reverse().toArray();
  },

  // 특정 작품 조회
  async getArtworkById(id) {
    return await db.artworks.get(Number(id));
  },

  // 새 작품 등록
  async addArtwork(artworkData) {
    const now = new Date().toISOString();
    const newEntry = {
      title: (artworkData.title && artworkData.title.trim()) || '제목 미상 (Untitled)',
      artist: (artworkData.artist && artworkData.artist.trim()) || '작가 미상 (Unknown)',
      location: artworkData.location || '',
      viewDate: artworkData.viewDate || new Date().toISOString().slice(0, 10),
      rating: Number(artworkData.rating) || 0,
      notes: artworkData.notes || '',
      image: artworkData.image || '', // Base64 string
      tags: artworkData.tags || [],
      createdAt: now,
      updatedAt: now
    };
    const id = await db.artworks.add(newEntry);
    return { ...newEntry, id };
  },

  // 작품 정보 수정
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

    // 키워드 검색 (작품명, 작가명, 장소, 메모)
    if (keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      collection = collection.filter(item => 
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.artist && item.artist.toLowerCase().includes(q)) ||
        (item.location && item.location.toLowerCase().includes(q)) ||
        (item.notes && item.notes.toLowerCase().includes(q))
      );
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
      // latest (등록순)
      collection.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return collection;
  },

  // 전체 개수 및 통계
  async getStats() {
    const all = await this.getAllArtworks();
    const totalCount = all.length;
    const locations = new Set(all.map(a => a.location).filter(Boolean));
    const averageRating = totalCount > 0 
      ? (all.reduce((acc, cur) => acc + (cur.rating || 0), 0) / totalCount).toFixed(1)
      : '0.0';
    return {
      totalCount,
      uniqueLocationsCount: locations.size,
      averageRating
    };
  }
};

window.ArtStorage = ArtStorage;
