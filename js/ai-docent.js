/**
 * ART INSIGHT — Multimodal AI Art Docent Engine
 * Google Gemini Vision API 연동 및 심층 미술 도슨트 분석 모듈
 */

const ArtAiDocent = {
  STORAGE_KEY: 'art_insight_gemini_api_key',
  DEFAULT_MODEL: 'gemini-1.5-flash',

  // API Key 가져오기
  getApiKey() {
    return localStorage.getItem(this.STORAGE_KEY) || '';
  },

  // API Key 저장하기
  setApiKey(key) {
    if (!key) {
      localStorage.removeItem(this.STORAGE_KEY);
    } else {
      localStorage.setItem(this.STORAGE_KEY, key.trim());
    }
  },

  // API Key 유효 여부 확인
  hasApiKey() {
    const key = this.getApiKey();
    return Boolean(key && key.length > 10);
  },

  // Base64 데이터에서 MIME 타입과 순수 Base64 분리
  parseBase64(dataUrl) {
    const matches = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('유효하지 않은 이미지 데이터 포맷입니다.');
    }
    return {
      mimeType: matches[1],
      data: matches[2]
    };
  },

  // 심층 도슨트 분석 프롬프트 생성
  buildDocentPrompt(authorNotes = '', labelText = '') {
    return `
당신은 세계적인 현대미술관의 수석 도슨트이자 저명한 아트 매거진의 미술 평론가입니다.
제공된 미술 작품 이미지(및 함께 첨부된 전시 라벨/작가 노트)를 시각적 근거에 기반하여 깊이 있게 분석해 주십시오.

[작성 및 분석의 절대 원칙]
1. 문체: 미술관 도슨트의 품격 있고 친절한 안내와, 미술 전문지의 깊이 있고 유려한 평론 문체를 결합하십시오. 기술적 데이터 분석 보고서처럼 쓰지 마십시오.
2. 미술사조 분석 원칙: 
   - 미술사조를 숫자나 백분율(예: 30% 인상주의 등)로 절대 표현하지 마십시오.
   - 여러 미술사조의 특징이 융합된 경우, 각 사조가 어떤 시각적 요소(색채, 형태, 구도 등)에서 발현되고 상호작용하는지 서술하십시오.
   - 기존 미술사조로 규정하기 힘든 작가만의 독창적인 조형 언어도 존중하여 다루십시오.
3. 시각적 사실과 해석의 분리:
   - 색채, 구도, 형태, 붓질, 질감, 명암 등 이미지에서 실제로 관찰할 수 있는 구체적인 시각적 증거를 바탕으로 분석하십시오.
   - 작품의 의미를 하나의 정답으로 단정하지 말고, 열린 다각적 해석을 제시하십시오.
4. 작가 의도와 AI 독립적 해석의 비교:
   - 사용자가 작가 노트나 라벨 텍스트를 제공한 경우, 작가가 밝힌 의도와 AI가 시각적으로 관찰하고 해석한 지점을 명확히 비교하십시오.
   - 작가 노트가 첨부되지 않은 경우, 작가의 의도를 임의로 날조하지 마십시오.
5. 유사 작가 3인:
   - 시각적 화풍과 조형적 연관성이 뚜렷한 작가 3명을 엄선하십시오.
   - 단순 나열이 아닌 유사한 조형 요소, 명확한 차이점, 대표작을 구체적으로 제시하십시오.

[출력 형식 가이드]
반드시 아래의 JSON 구조에 맞추어 마크다운 코드 블록(\`\`\`json ... \`\`\`) 없이 순수 JSON 문자열만을 반환하거나, 파싱 가능한 유효한 JSON 형식으로 응답하십시오.

{
  "suggestedTitle": "작품에서 유추되거나 라벨에 적힌 작품명 (알 수 없으면 시각적 인상을 담은 임시 제목)",
  "suggestedArtist": "작품에서 유추되거나 라벨에 적힌 작가명 (알 수 없으면 '작자 미상')",
  "firstImpression": "작품 전체에서 전해지는 압도적인 분위기, 가장 먼저 시선을 사로잡는 시각적 요소, 정서와 긴장감 서술 (2~3문단)",
  "artHistoricalContext": {
    "movements": ["관련 미술사조 명칭 1", "관련 미술사조 2"],
    "narrative": "미술사적 맥락과 사조들의 유기적인 상호작용 서술 (숫자/백분율 금지, 독창성 강조)"
  },
  "formalElements": {
    "color": "주요 색상, 색채 대비, 정서적 울림",
    "composition": "화면 구성, 시선의 흐름, 공간의 균형과 배치",
    "form": "구상과 추상성, 형태의 단순화 및 왜곡",
    "brushworkAndTexture": "붓터치의 속도감과 방향성, 마티에르(질감), 물감의 물성과 기법",
    "lightAndShadow": "빛과 명암의 운용"
  },
  "similarArtists": [
    {
      "name": "작가 이름 (국문 및 영문)",
      "artisticStyle": "해당 작가의 대표 화풍 및 미술사적 위치",
      "similarities": "본 작품과 시각적으로 유사한 구체적 부분",
      "differences": "두 화풍 간의 결정적 차이점",
      "keyWork": "참고하여 감상할 만한 대표 작품"
    },
    {
      "name": "작가 이름 (국문 및 영문)",
      "artisticStyle": "...",
      "similarities": "...",
      "differences": "...",
      "keyWork": "..."
    },
    {
      "name": "작가 이름 (국문 및 영문)",
      "artisticStyle": "...",
      "similarities": "...",
      "differences": "...",
      "keyWork": "..."
    }
  ],
  "interpretation": {
    "symbolsAndThemes": "화면에 깃든 상징, 주제 의식, 철학적 사유",
    "multiplePerspectives": "단정 짓지 않는 다양한 해석의 가능성들과 작품이 던지는 질문"
  },
  "authorIntentVsAiPerspective": {
    "hasAuthorNote": ${Boolean(authorNotes || labelText)},
    "authorIntent": "${authorNotes || labelText ? '제공된 자료를 바탕으로 요약한 작가의 의도' : '첨부된 작가 설명 자료가 없어 작가의 의도를 예단하지 않습니다.'}",
    "aiObservation": "이미지에서 AI가 객관적으로 관찰한 시각적 특징",
    "comparativeAnalysis": "${authorNotes || labelText ? '작가의 의도와 AI의 시각적 해석이 일치하는 지점 및 새롭게 발견되는 시각적 긴장감 비교' : '시각적 이미지 자체에 집중하여 독립적인 해석을 전개합니다.'}"
  },
  "appreciationGuide": {
    "focusPoints": ["다시 볼 때 눈여겨보아야 할 미세한 시각적 포인트 1", "포인트 2"],
    "reflectiveQuestions": ["작품 앞에서 스스로에게 던져볼 만한 사유의 질문 1", "질문 2"]
  }
}

${authorNotes ? `[사용자가 첨부한 작가 노트/설명]:\n${authorNotes}\n` : ''}
${labelText ? `[사용자가 첨부한 전시 라벨/도록 텍스트]:\n${labelText}\n` : ''}
`;
  },

  // 메인 분석 실행 함수
  async analyzeArtwork({ mainImageDataUrl, labelImageDataUrl = null, authorNotes = '', labelText = '' }) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API_KEY_REQUIRED: Gemini API 키가 설정되지 않았습니다. 상단 [API 키 설정]에서 키를 등록해주세요.');
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.DEFAULT_MODEL}:generateContent?key=${apiKey}`;

    // 이미지 파트 준비
    const mainImg = this.parseBase64(mainImageDataUrl);
    const contentsParts = [
      {
        inlineData: {
          mimeType: mainImg.mimeType,
          data: mainImg.data
        }
      }
    ];

    // 라벨 이미지도 첨부되었으면 멀티모달 파트로 추가
    if (labelImageDataUrl) {
      try {
        const labelImg = this.parseBase64(labelImageDataUrl);
        contentsParts.push({
          inlineData: {
            mimeType: labelImg.mimeType,
            data: labelImg.data
          }
        });
      } catch (e) {
        console.warn('라벨 이미지 파싱 실패, 무시하고 진행합니다.', e);
      }
    }

    // 프롬프트 추가
    const promptText = this.buildDocentPrompt(authorNotes, labelText);
    contentsParts.push({
      text: promptText
    });

    const requestBody = {
      contents: [
        {
          parts: contentsParts
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topP: 0.95,
        responseMimeType: 'application/json'
      }
    };

    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
    } catch (networkError) {
      throw new Error('네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.');
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || `서버 응답 오류 (HTTP ${response.status})`;
      if (response.status === 400 || response.status === 403) {
        throw new Error(`API 키가 올바르지 않거나 권한이 없습니다. (${errMsg})`);
      }
      throw new Error(`AI 분석 요청 실패: ${errMsg}`);
    }

    const resultJson = await response.json();
    const candidate = resultJson.candidates?.[0];
    if (!candidate || !candidate.content?.parts?.[0]?.text) {
      throw new Error('AI 모델로부터 유효한 분석 응답을 수신하지 못했습니다.');
    }

    const rawText = candidate.content.parts[0].text.trim();
    
    // JSON 파싱 (코드 블록 방어 처리)
    let parsedData;
    try {
      let cleaned = rawText;
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      parsedData = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('JSON 파싱 오류 원본 응답:', rawText);
      throw new Error('AI 응답을 분석 리포트 규격으로 변환하는 데 실패했습니다. 다시 시도해주세요.');
    }

    return parsedData;
  }
};

window.ArtAiDocent = ArtAiDocent;
