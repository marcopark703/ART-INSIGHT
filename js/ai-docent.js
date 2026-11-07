/**
 * ART INSIGHT — Fast Docent & In-Depth Curatorial Engine
 * 현장 관람 최적화: 1~2초 고속 퀵 도슨트 + 선택적 심층 리포트 2단계 엔진
 * (2026년 기준 공식 지원 모델: gemini-3.8-flash, gemini-3.6-flash)
 */

const ArtAiDocent = {
  STORAGE_KEY: 'art_insight_gemini_api_key',
  MODEL_STORAGE_KEY: 'art_insight_gemini_model',
  DEFAULT_MODEL: 'gemini-3.8-flash',

  getApiKey() {
    return (localStorage.getItem(this.STORAGE_KEY) || '').trim();
  },

  setApiKey(key) {
    if (!key || !key.trim()) {
      localStorage.removeItem(this.STORAGE_KEY);
    } else {
      localStorage.setItem(this.STORAGE_KEY, key.trim());
    }
  },

  hasApiKey() {
    const key = this.getApiKey();
    return Boolean(key && key.length > 15);
  },

  getSelectedModel() {
    let m = (localStorage.getItem(this.MODEL_STORAGE_KEY) || this.DEFAULT_MODEL).trim();
    // 2026년 기준 지원 중단된 과거 모델(1.x, 2.x, 3.5)이 남아있는 경우 최신 안정 gemini-3.8-flash로 자동 마이그레이션
    if (!m.startsWith('gemini-3.8') && !m.startsWith('gemini-3.6')) {
      m = this.DEFAULT_MODEL;
      localStorage.setItem(this.MODEL_STORAGE_KEY, m);
    }
    return m;
  },

  setSelectedModel(modelName) {
    const sanitized = (modelName || this.DEFAULT_MODEL).trim();
    localStorage.setItem(this.MODEL_STORAGE_KEY, sanitized);
  },

  parseBase64(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') {
      throw new Error('유효한 이미지 데이터가 전달되지 않았습니다.');
    }
    const matches = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('유효하지 않은 이미지 Base64 포맷입니다.');
    }
    return { mimeType: matches[1], data: matches[2] };
  },

  // 실시간 구글 서버 API 지원 모델 목록 조회 (v1beta & v1)
  async fetchAvailableModels(apiKey) {
    const key = (apiKey || this.getApiKey()).trim();
    if (!key) throw new Error('API 키가 입력되지 않았습니다.');

    let data = null;
    for (const ver of ['v1beta', 'v1']) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/${ver}/models?key=${key}`;
        const response = await fetch(endpoint, { signal: AbortSignal.timeout(10000) });
        if (response.ok) {
          data = await response.json();
          break;
        }
      } catch (e) {
        console.warn(`[ART INSIGHT] ${ver} ListModels 실패:`, e);
      }
    }

    if (!data || !data.models) {
      throw new Error('구글 서버 모델 목록 조회에 실패했습니다. API 키를 확인해주세요.');
    }

    const models = (data.models || [])
      .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
      .map(m => m.name.replace(/^models\//, ''))
      .filter(name => !name.includes('embedding') && !name.includes('aqa') && !name.includes('imagen'));

    return models;
  },

  // 1단계: 퀵 도슨트 프롬프트 (전시장에서 1~2초 만에 듣는 친절한 도슨트 귓속말)
  buildQuickDocentPrompt(authorNotes = '') {
    return `
당신은 관람객 바로 옆에서 다정하고 세련되게 귀띔해 주는 미술관 수석 도슨트입니다.
업로드된 그림을 보고, 관람객이 전시 현장에서 즉시 흥미롭게 감상할 수 있도록 핵심만 간결하고 품격 있는 도슨트의 목소리로 설명해주세요.

[작성 원칙]
1. 복잡한 논문이나 블로그 글처럼 길게 쓰지 마십시오.
2. "이 작품은요..." 하고 조곤조곤 짚어주는 자연스럽고 친절한 대화체(~입니다, ~해보세요)를 사용하십시오.
3. 미술사조를 숫자나 백분율(% 기호)로 쓰지 마십시오.
4. 아래 JSON 포맷으로만 응답하십시오.

JSON 구조:
{
  "suggestedTitle": "작품명 (추정 또는 유추되는 제목, 모르면 인상적인 어울리는 제목)",
  "suggestedArtist": "화가명 (추정되는 작가 이름, 모르면 작자 미상)",
  "artStyle": "핵심 화풍 한눈에 보기 (예: 인상주의적 빛과 표현주의적 강렬한 색채)",
  "docentVoice": "도슨트의 친절한 핵심 해설 (작품의 첫인상, 전체적인 분위기, 어떤 마음으로 그렸는지 2~3문장)",
  "viewingPoint": "지금 바로 눈여겨볼 시각적 감상 팁 (어느 부분의 색채나 붓터치, 형태를 보면 좋은지 1~2문장)"
}
${authorNotes ? `[참고자료/작가노트]: ${authorNotes}` : ''}
`;
  },

  // 2단계: 심층 도슨트 프롬프트 (필요할 때만 펼쳐보는 매거진급 심층 평론)
  buildDeepDocentPrompt(quickData, authorNotes = '', labelText = '') {
    return `
당신은 권위 있는 아트 매거진의 미술 평론가이자 미술사학자입니다.
기존 퀵 도슨트 정보("${quickData?.suggestedTitle || '작품'}" / "${quickData?.suggestedArtist || '작가'}")를 바탕으로,
이 작품의 미술사적 맥락, 조형적 기법 5대 요소, 시각적 연관성을 지닌 유사 거장 작가 3인, 그리고 작품의 다각적 해석을 심층적으로 분석하십시오.
미술사조를 백분율이나 숫자로 분류하지 마십시오.

출력은 반드시 유효한 JSON 포맷이어야 합니다.
JSON 구조:
{
  "artHistoricalContext": {
    "movements": ["관련 미술사조 1", "사조 2"],
    "narrative": "미술사적 맥락과 사조들의 상호작용 평론 서술"
  },
  "formalElements": {
    "color": "주요 색상과 색채 대비의 정서적 효과",
    "composition": "화면 구성과 시선의 흐름",
    "form": "형태의 왜곡과 구상/추상성",
    "brushworkAndTexture": "붓질과 마티에르, 재료의 물성",
    "lightAndShadow": "빛과 명암의 운용"
  },
  "similarArtists": [
    {
      "name": "작가 이름 1",
      "artisticStyle": "대표 화풍",
      "similarities": "시각적 유사점",
      "differences": "화풍의 차이점",
      "keyWork": "대표 참고작"
    },
    {
      "name": "작가 이름 2",
      "artisticStyle": "대표 화풍",
      "similarities": "시각적 유사점",
      "differences": "화풍의 차이점",
      "keyWork": "대표 참고작"
    },
    {
      "name": "작가 이름 3",
      "artisticStyle": "대표 화풍",
      "similarities": "시각적 유사점",
      "differences": "화풍의 차이점",
      "keyWork": "대표 참고작"
    }
  ],
  "interpretation": {
    "symbolsAndThemes": "상징과 철학적 사유",
    "multiplePerspectives": "열린 다각적 해석과 사유의 질문"
  },
  "authorIntentVsAiPerspective": {
    "hasAuthorNote": ${Boolean(authorNotes || labelText)},
    "authorIntent": "${authorNotes || labelText ? '작가의 밝힌 의도' : '자료 미첨부'}",
    "aiObservation": "AI가 시각적으로 관찰한 특징",
    "comparativeAnalysis": "작가의 의도와 시각적 관찰 비교 분석"
  },
  "appreciationGuide": {
    "focusPoints": ["심층 주목 포인트 1", "포인트 2"],
    "reflectiveQuestions": ["사유의 질문 1", "질문 2"]
  }
}
`;
  },

  // 1단계: 퀵 도슨트 분석 실행 (초고속 1~2초 응답, thinkingLevel: low)
  async analyzeQuickDocent({ mainImageDataUrl, authorNotes = '' }) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API_KEY_REQUIRED: Gemini API 키가 설정되지 않았습니다.');
    }

    const mainImg = this.parseBase64(mainImageDataUrl);
    const promptText = this.buildQuickDocentPrompt(authorNotes);

    const parts = [
      { text: promptText },
      { inline_data: { mime_type: mainImg.mimeType, data: mainImg.data } }
    ];

    const requestBody = {
      contents: [{ parts: parts }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.9,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
        thinkingConfig: {
          thinkingLevel: 'low'
        }
      }
    };

    return await this.callGeminiApiWithRetry(apiKey, requestBody);
  },

  // 2단계: 심층 도슨트 분석 실행 (사용자가 원할 때만 추가 호출)
  async analyzeDeepDocent({ mainImageDataUrl, quickData, authorNotes = '', labelText = '' }) {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error('API 키가 없습니다.');

    const mainImg = this.parseBase64(mainImageDataUrl);
    const promptText = this.buildDeepDocentPrompt(quickData, authorNotes, labelText);

    const parts = [
      { text: promptText },
      { inline_data: { mime_type: mainImg.mimeType, data: mainImg.data } }
    ];

    const requestBody = {
      contents: [{ parts: parts }],
      generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
        thinkingConfig: {
          thinkingLevel: 'medium'
        }
      }
    };

    return await this.callGeminiApiWithRetry(apiKey, requestBody);
  },

  // 2026년 Gemini 3.8 Flash 전용 API 호출 & 재시도 핸들러
  async callGeminiApiWithRetry(apiKey, requestBody) {
    const userSelected = this.getSelectedModel();
    const candidateModels = [
      userSelected,
      'gemini-3.8-flash',
      'gemini-3.6-flash'
    ].filter(Boolean);

    const modelsToTry = [...new Set(candidateModels)];
    let lastErrorMsg = '';

    const sleep = (ms) => new Promise(r => setTimeout(r, ms));

    for (const model of modelsToTry) {
      // v1beta 및 v1 둘 다 지원
      for (const apiVersion of ['v1beta', 'v1']) {
        const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${model}:generateContent?key=${apiKey}`;

        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            console.log(`[ART INSIGHT] ${apiVersion}/${model} 호출 (시도 ${attempt})`);
            
            // 15초 초과 시 타임아웃하여 2분 대기 방지
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(requestBody),
              signal: AbortSignal.timeout(15000)
            });

            if (!response.ok) {
              const errData = await response.json().catch(() => ({}));
              const errMsg = errData.error?.message || `HTTP ${response.status}`;

              if (response.status === 400 && errMsg.includes('API_KEY_INVALID')) {
                throw new Error('API_KEY_INVALID: 입력하신 Gemini API 키가 올바르지 않습니다.');
              }

              // High Demand(503) 또는 Rate Limit(429) 시 1.5초 대기 후 1회 재시도
              if (response.status === 429 || response.status === 503 || errMsg.includes('demand')) {
                if (attempt === 1) {
                  console.warn(`[ART INSIGHT] 구글 일시 과부하(${response.status}), 1.5초 후 재시도...`);
                  await sleep(1500);
                  continue;
                } else {
                  lastErrorMsg = '구글 서버의 일시적 트래픽 집중 상태입니다. 잠시 후 다시 시도해 주세요.';
                  break;
                }
              }

              lastErrorMsg = errMsg;
              // 404 등 모델/버전 불일치 시 다음으로 즉시 이동
              break;
            }

            const resultJson = await response.json();
            const candidate = resultJson.candidates?.[0];
            if (!candidate || !candidate.content?.parts) {
              throw new Error('유효한 응답 데이터가 없습니다.');
            }

            // thinking 모델 대응: thought 파트가 아닌 실제 answer 파트 추출
            const answerPart = candidate.content.parts.find(p => !p.thought && p.text) 
              || candidate.content.parts[candidate.content.parts.length - 1];
            
            if (!answerPart || !answerPart.text) {
              throw new Error('응답 본문 텍스트를 찾을 수 없습니다.');
            }

            let cleaned = answerPart.text.trim();
            if (cleaned.startsWith('```json')) {
              cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleaned.startsWith('```')) {
              cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            return JSON.parse(cleaned);

          } catch (err) {
            if (err.message.startsWith('API_KEY_INVALID')) throw err;
            if (err.name === 'TimeoutError') {
              console.warn(`[ART INSIGHT] ${model} 요청 타임아웃 (15초)`);
              lastErrorMsg = '서버 응답 지연으로 요청이 타임아웃되었습니다.';
              break;
            }
            lastErrorMsg = err.message;
            break;
          }
        }
      }
    }

    throw new Error(lastErrorMsg || 'AI 모델 응답에 실패했습니다. 잠시 후 다시 시도해 주세요.');
  },

  // 체험용 퀵 도슨트 샘플
  generateSampleQuickDocent() {
    return {
      suggestedTitle: '별이 빛나는 밤 (The Starry Night)',
      suggestedArtist: '빈센트 반 고흐 (Vincent van Gogh)',
      artStyle: '후기 인상주의 및 표현주의의 격정적 소용돌이',
      docentVoice: '어둠이 내려앉은 밤하늘을 소용돌이치는 강렬한 붓질과 찬란한 노란 별빛으로 가득 채운 명작입니다. 고흐가 생레미 요양원의 창밖을 바라보며 느꼈던 깊은 고독과 자연의 신비로운 생명력이 고스란히 전해집니다.',
      viewingPoint: '하늘 가운데 거대하게 회오리치는 코발트 블루의 물결과, 왼쪽 전면에 솟아오른 짙은 사이프러스 나무의 상승하는 실루엣을 눈여겨보세요.'
    };
  },

  // 체험용 전체 심층 도슨트 리포트 샘플
  generateSampleDocentReport() {
    const quick = this.generateSampleQuickDocent();
    return {
      ...quick,
      firstImpression: quick.docentVoice,
      artHistoricalContext: {
        movements: ['후기 인상주의 (Post-Impressionism)', '표현주의 (Expressionism)'],
        narrative: '이 작품은 인상주의의 순간적 빛 관찰에서 출발하였으나, 작가의 내면적 격정과 영적 감정을 표출하기 위해 형태를 주관적으로 왜곡한 후기 인상주의의 정점입니다. 격정적인 붓질과 원색의 강렬한 대비는 훗날 독일 표현주의와 현대 추상미술로 이어지는 거대한 징검다리가 되었습니다.'
      },
      formalElements: {
        color: '울트라마린, 코발트 블루의 깊은 밤빛과 찬란한 크롬 옐로우의 별빛이 극적인 보색 대비를 이룹니다.',
        composition: '왼쪽 전경의 수직적 사이프러스 나무와 오른쪽으로 굽이치는 수평적 밤하늘이 완벽한 시각적 균형을 이룹니다.',
        form: '자연의 실제 모습을 넘어서 소용돌이치는 리듬감과 왜곡된 타원형으로 단순화되었습니다.',
        brushworkAndTexture: '물감을 두껍게 덧바른 임파스토(Impasto) 기법으로 붓의 속도감과 거친 생명력이 살아있습니다.',
        lightAndShadow: '자연의 광원 대신 화가의 내면에서 뿜어져 나오는 초자연적이고 영적인 빛의 진동이 화면을 지배합니다.'
      },
      similarArtists: [
        {
          name: '에드바르 뭉크 (Edvard Munch)',
          artisticStyle: '초기 표현주의 및 상징주의',
          similarities: '물결치는 곡선과 왜곡된 공간을 통해 화가의 내면적 불안과 정서를 캔버스에 투영한 점',
          differences: '고흐는 자연의 생명력과 영성을 찬미한 반면, 뭉크는 인간의 실존적 불안과 죽음에 집중',
          keyWork: '절규 (The Scream, 1893)'
        },
        {
          name: '폴 고갱 (Paul Gauguin)',
          artisticStyle: '종합주의 및 후기 인상주의',
          similarities: '눈에 보이는 사실적 색채를 거부하고 화가의 감정과 상징을 담은 주관적 색채 사용',
          differences: '고흐의 거칠고 역동적인 붓질과 달리 고갱은 평면적이고 장식적인 색면 구성을 추구',
          keyWork: '설교 후의 환영 (Vision after the Sermon, 1888)'
        },
        {
          name: '클로드 모네 (Claude Monet)',
          artisticStyle: '인상주의 창시',
          similarities: '빛의 변화와 대기의 움직임을 캔버스에 포착하려는 시각적 탐구',
          differences: '모네가 객관적인 자연광의 변화를 포착했다면, 고흐는 주관적인 영혼의 파동을 그려냄',
          keyWork: '수련 (Water Lilies, 1916)'
        }
      ],
      interpretation: {
        symbolsAndThemes: '하늘과 땅을 잇는 사이프러스 나무는 영원과 슬픔을 상징하며, 밤하늘의 11개 별과 달은 고독 속에서도 꺼지지 않는 희망과 예술혼을 의미합니다.',
        multiplePerspectives: '정신적 고통 속의 발작적 환각이라는 해석과, 당시 천문학 관측과 성경적 상징이 결합된 고도로 계산된 예술적 성취라는 상반된 해석이 공존합니다.'
      },
      authorIntentVsAiPerspective: {
        hasAuthorNote: true,
        authorIntent: '"지도에서 도시나 마을을 가리키는 검은 점을 보면 꿈을 꾸게 되는 것처럼, 별이 총총한 밤하늘을 볼 때마다 나는 늘 꿈을 꾼다."',
        aiObservation: '캔버스 전체에 집요하게 반복된 짧고 굽이치는 붓터치는 단순한 감정의 폭발이 아니라 화면 전체를 하나로 엮는 놀라운 조형적 일관성을 보여줍니다.',
        comparativeAnalysis: '작가가 동생 테오에게 보낸 편지에서 언급한 고요한 밤의 묵상과 달리, 시각적으로 완성된 화면은 거대한 코스모스의 생명력이 요동치는 극적 긴장감을 품고 있습니다.'
      },
      appreciationGuide: {
        focusPoints: [
          '하늘 한가운데를 가로지르는 은하수 같은 소용돌이의 붓터치 방향',
          '작은 마을의 고요한 첨탑과 대비되는 전면 사이프러스 나무의 거대한 어둠'
        ],
        reflectiveQuestions: [
          '화가는 왜 칠흑 같은 밤을 어둠이 아닌 눈부신 노란빛과 푸른빛의 교향곡으로 그렸을까요?',
          '당신에게 가장 깊은 위안을 주는 밤하늘의 색채는 어떤 모습인가요?'
        ]
      }
    };
  }
};

window.ArtAiDocent = ArtAiDocent;
