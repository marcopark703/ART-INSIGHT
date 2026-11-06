/**
 * ART INSIGHT — Multimodal AI Art Docent Engine
 * Google Gemini Vision API 연동 및 심층 미술 도슨트 분석 모듈
 */

const ArtAiDocent = {
  STORAGE_KEY: 'art_insight_gemini_api_key',

  // API Key 가져오기
  getApiKey() {
    return (localStorage.getItem(this.STORAGE_KEY) || '').trim();
  },

  // API Key 저장하기
  setApiKey(key) {
    if (!key || !key.trim()) {
      localStorage.removeItem(this.STORAGE_KEY);
    } else {
      localStorage.setItem(this.STORAGE_KEY, key.trim());
    }
  },

  // API Key 유효 여부 확인
  hasApiKey() {
    const key = this.getApiKey();
    return Boolean(key && key.length > 15);
  },

  // Base64 데이터에서 MIME 타입과 순수 Base64 분리
  parseBase64(dataUrl) {
    if (!dataUrl || typeof dataUrl !== 'string') {
      throw new Error('유효한 이미지 데이터가 전달되지 않았습니다.');
    }
    const matches = dataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('유효하지 않은 이미지 Base64 포맷입니다.');
    }
    return {
      mimeType: matches[1],
      data: matches[2]
    };
  },

  // 사용 가능한 Gemini 모델을 API에서 동적으로 감지 (ListModels)
  async discoverBestModel(apiKey) {
    const preferredOrder = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash-002',
      'gemini-1.5-flash-8b',
      'gemini-2.0-flash-exp',
      'gemini-1.5-pro',
      'gemini-1.5-pro-latest',
      'gemini-1.5-pro-002'
    ];

    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (res.ok) {
        const data = await res.json();
        const available = (data.models || [])
          .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
          .map(m => m.name.replace(/^models\//, ''));

        // 선호 순서대로 매칭되는 첫 번째 모델 반환
        for (const pref of preferredOrder) {
          if (available.includes(pref)) {
            console.log(`[ART INSIGHT] 동적 감지된 최적 모델: ${pref}`);
            return pref;
          }
        }

        // 선호 목록에 없더라도 gemini가 들어간 사용 가능 모델 선택
        const anyGemini = available.find(m => m.includes('gemini'));
        if (anyGemini) {
          console.log(`[ART INSIGHT] 감지된 사용 가능 모델: ${anyGemini}`);
          return anyGemini;
        }
      }
    } catch (e) {
      console.warn('ListModels 동적 감지 실패, 기본 폴백 모델을 시도합니다.', e);
    }

    // fallback 기본값
    return 'gemini-2.0-flash';
  },

  // 심층 도슨트 분석 프롬프트 생성
  buildDocentPrompt(authorNotes = '', labelText = '') {
    const cleanNotes = (authorNotes || '').replace(/"/g, "'").trim();
    const cleanLabel = (labelText || '').replace(/"/g, "'").trim();

    return `
당신은 세계적인 현대미술관의 수석 도슨트이자 저명한 아트 매거진의 미술 평론가입니다.
제공된 미술 작품 이미지(및 함께 첨부된 전시 라벨/작가 노트)를 시각적 근거에 기반하여 깊이 있게 분석해 주십시오.

[작성 및 분석의 절대 원칙]
1. 문체: 미술관 도슨트의 품격 있고 친절한 안내와, 미술 전문지의 깊이 있고 유려한 평론 문체를 결합하십시오. 기술적 데이터 분석 보고서처럼 작성하지 마십시오.
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
반드시 유효한 JSON 형식으로만 응답해야 합니다. 마크다운 코드 블록 없이 순수 JSON만 반환하십시오.

JSON 구조:
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
      "artisticStyle": "해당 작가의 대표 화풍 및 미술사적 위치",
      "similarities": "본 작품과 시각적으로 유사한 구체적 부분",
      "differences": "두 화풍 간의 결정적 차이점",
      "keyWork": "참고하여 감상할 만한 대표 작품"
    },
    {
      "name": "작가 이름 (국문 및 영문)",
      "artisticStyle": "해당 작가의 대표 화풍 및 미술사적 위치",
      "similarities": "본 작품과 시각적으로 유사한 구체적 부분",
      "differences": "두 화풍 간의 결정적 차이점",
      "keyWork": "참고하여 감상할 만한 대표 작품"
    }
  ],
  "interpretation": {
    "symbolsAndThemes": "화면에 깃든 상징, 주제 의식, 철학적 사유",
    "multiplePerspectives": "단정 짓지 않는 다양한 해석의 가능성들과 작품이 던지는 질문"
  },
  "authorIntentVsAiPerspective": {
    "hasAuthorNote": ${Boolean(cleanNotes || cleanLabel)},
    "authorIntent": "${cleanNotes || cleanLabel ? '제공된 자료를 바탕으로 요약한 작가의 의도' : '첨부된 작가 설명 자료가 없어 작가의 의도를 예단하지 않습니다.'}",
    "aiObservation": "이미지에서 AI가 객관적으로 관찰한 시각적 특징",
    "comparativeAnalysis": "${cleanNotes || cleanLabel ? '작가의 의도와 AI의 시각적 해석이 일치하는 지점 및 새롭게 발견되는 시각적 긴장감 비교' : '시각적 이미지 자체에 집중하여 독립적인 해석을 전개합니다.'}"
  },
  "appreciationGuide": {
    "focusPoints": ["다시 볼 때 눈여겨보아야 할 미세한 시각적 포인트 1", "포인트 2"],
    "reflectiveQuestions": ["작품 앞에서 스스로에게 던져볼 만한 사유의 질문 1", "질문 2"]
  }
}

${cleanNotes ? `\n[사용자가 첨부한 작가 노트/설명]:\n${cleanNotes}\n` : ''}
${cleanLabel ? `\n[사용자가 첨부한 전시 라벨/도록 텍스트]:\n${cleanLabel}\n` : ''}
`;
  },

  // 메인 분석 실행 함수 (동적 모델 감지 + 다중 Fallback 체인)
  async analyzeArtwork({ mainImageDataUrl, labelImageDataUrl = null, authorNotes = '', labelText = '' }) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error('API_KEY_REQUIRED: Gemini API 키가 설정되지 않았습니다.');
    }

    const mainImg = this.parseBase64(mainImageDataUrl);
    const promptText = this.buildDocentPrompt(authorNotes, labelText);

    // Google Generative AI REST 표준 형식 구성 (snake_case)
    const parts = [
      {
        text: promptText
      },
      {
        inline_data: {
          mime_type: mainImg.mimeType,
          data: mainImg.data
        }
      }
    ];

    if (labelImageDataUrl) {
      try {
        const labelImg = this.parseBase64(labelImageDataUrl);
        parts.push({
          inline_data: {
            mime_type: labelImg.mimeType,
            data: labelImg.data
          }
        });
      } catch (e) {
        console.warn('라벨 이미지 첨부 스킵:', e);
      }
    }

    const requestBody = {
      contents: [
        {
          parts: parts
        }
      ],
      generationConfig: {
        temperature: 0.35,
        topP: 0.95,
        responseMimeType: 'application/json'
      }
    };

    // 1단계: API 키에 권한이 있는 최적 모델 동적 탐색
    const discoveredModel = await this.discoverBestModel(apiKey);
    const candidatesToTry = [
      discoveredModel,
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-2.0-flash-exp'
    ];
    // 중복 제거
    const uniqueModels = [...new Set(candidatesToTry)];

    let lastErrorMessage = '';

    for (const model of uniqueModels) {
      // v1beta 및 v1 둘 다 호환 시도
      const urlsToTry = [
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`
      ];

      for (const endpoint of urlsToTry) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const errMsg = errData.error?.message || `HTTP ${response.status}`;
            
            if (response.status === 400 && errMsg.includes('API_KEY_INVALID')) {
              throw new Error('API_KEY_INVALID: 입력하신 Gemini API 키가 올바르지 않습니다. Google AI Studio에서 키를 다시 확인해주세요.');
            }
            if (response.status === 429) {
              throw new Error('RATE_LIMIT: API 호출 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
            }

            lastErrorMessage = errMsg;
            continue; // 다음 URL/모델 시도
          }

          const resultJson = await response.json();
          const candidate = resultJson.candidates?.[0];
          if (!candidate || !candidate.content?.parts?.[0]?.text) {
            continue;
          }

          const rawText = candidate.content.parts[0].text.trim();
          let cleaned = rawText;
          if (cleaned.startsWith('```json')) {
            cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
          } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
          }

          console.log(`[ART INSIGHT] 모델 [${model}]로부터 성공적으로 분석을 수신했습니다.`);
          return JSON.parse(cleaned);

        } catch (fetchErr) {
          if (fetchErr.message.startsWith('API_KEY_INVALID') || fetchErr.message.startsWith('RATE_LIMIT')) {
            throw fetchErr;
          }
          lastErrorMessage = fetchErr.message;
        }
      }
    }

    throw new Error(`AI 모델 응답 오류: ${lastErrorMessage || '연결 가능한 모델을 찾을 수 없습니다.'}`);
  },

  // [체험용 샘플 도슨트 데이터]
  generateSampleDocentReport(artworkTitle = '빛과 침묵의 공간', artistName = '에디토리얼 마스터') {
    return {
      suggestedTitle: artworkTitle || '빛과 침묵의 공간 (Space of Light & Silence)',
      suggestedArtist: artistName || '작자 미상 (현대 미술)',
      firstImpression: `작품을 마주하는 순간 가장 먼저 다가오는 것은 팽팽하게 응축된 고요함과 빛의 온기입니다.\n\n화면 전체를 지배하는 부드러운 명암의 그라데이션은 관람자의 시선을 자연스럽게 캔버스 깊은 곳으로 이끌며, 대상의 디테일을 과감히 생략하고 형태의 본질적인 윤곽만을 남겨둠으로써 감상자에게 깊은 시각적 명상의 시간을 선사합니다.\n\n거칠지 않게 축적된 물감의 층위는 마치 오랜 시간의 퇴적물을 바라보는 듯한 서정적 긴장감을 자아냅니다.`,
      artHistoricalContext: {
        movements: ['후기 인상주의의 색채 감각', '미니멀리즘적 공간 구성', '색면추상(Color Field)'],
        narrative: `이 작품은 20세기 초 후기 인상주의가 탐구했던 빛과 색채의 자율성을 출발점으로 삼으면서도, 미니멀리즘 특유의 정제된 기하학적 공간 구획을 절묘하게 결합하고 있습니다.\n\n불필요한 서사적 설명을 과감히 걷어내고 색채 그 자체가 가진 울림에 집중하는 방식은 마크 로스코(Mark Rothko)의 색면추상과 조형적 대화를 나누는 듯합니다. 특정 사조에 머무르지 않고, 구상적 모티프를 추상화된 시각적 질서로 승화시킨 작가만의 독창적인 조형 언어가 돋보입니다.`
      },
      formalElements: {
        color: '톤 다운된 어스(Earth) 계열의 베이지와 딥 오커, 그리고 은은하게 스며드는 코발트 틴트가 빚어내는 온화하면서도 절제된 색채 조화',
        composition: '수평과 수직의 비대칭적 황금 분할을 통해 안정감과 시각적 개방감을 동시에 확보한 여백 중심의 구도',
        form: '사물의 구체적인 형태를 해체하고 단순화하여 본질적인 기하학적 볼륨감으로 환원한 조형미',
        brushworkAndTexture: '붓자국을 매끄럽게 문지르면서도 하부 캔버스의 고유한 직조 질감을 은근히 드러내는 얇고 섬세한 레이어링 기법',
        lightAndShadow: '직접적인 광원을 배제하고 화면 내부에서부터 은은하게 배어 나오는 듯한 확산광(Diffused light)의 표현'
      },
      similarArtists: [
        {
          name: '조르조 모란디 (Giorgio Morandi)',
          artisticStyle: '이탈리아 정물화의 거장이자 형태의 극단적 단순화와 침묵의 미학을 탐구한 화가',
          similarities: '차분한 흙빛 톤과 대상의 경계를 부드럽게 흐리는 회화적 호흡, 고요한 명상적 정서',
          differences: '모란디가 일상의 병과 도자기에 천착한 반면, 본 작품은 공간성과 빛의 확산에 더 주안점을 둠',
          keyWork: '정물 (Natura Morta, 1950s 시리즈)'
        },
        {
          name: '에드워드 호퍼 (Edward Hopper)',
          artisticStyle: '미국 사실주의의 대표 작가로, 빛과 고독의 공간을 포착한 현대의 거장',
          similarities: '창을 통해 비스듬히 쏟아지는 명암의 날카로운 긴장감과 화면을 관통하는 현대인의 서정',
          differences: '호퍼의 극적인 인물 서사와 차가운 리얼리즘에 비해 훨씬 더 부드럽고 추상화된 서정성을 띰',
          keyWork: '햇빛 속의 사람들 (People in the Sun, 1960)'
        },
        {
          name: '마크 로스코 (Mark Rothko)',
          artisticStyle: '거대한 색면을 통해 인간의 근원적 감정과 숭고함을 이끌어낸 색면추상의 선구자',
          similarities: '경계가 번져 나가는 색면의 부유감과 색채를 통한 감정의 진동',
          differences: '완전한 비구상 거대 색면이 아닌, 현실의 공간적 지각을 여전히 유지하고 있는 점',
          keyWork: 'White Center (Yellow, Pink and Lavender on Rose, 1950)'
        }
      ],
      interpretation: {
        symbolsAndThemes: '비워냄으로써 비로소 채워지는 공간의 미학과, 분주한 현대의 소음 너머에 존재하는 내면의 안식',
        multiplePerspectives: '한 편으로는 고립과 쓸쓸함의 표상으로 읽힐 수도 있으나, 다른 시각에서는 자아를 온전히 마주할 수 있는 가장 평화로운 치유의 공간으로 해석될 수 있습니다.'
      },
      authorIntentVsAiPerspective: {
        hasAuthorNote: true,
        authorIntent: '일상의 번잡함을 잊고 빛이 머무는 찰나의 침묵을 관람객과 함께 호흡하고자 함',
        aiObservation: '빛의 방향성과 여백의 비율이 치밀하게 계산되어 관람자의 호흡을 차분하게 가라앉히는 시각적 구조를 형성함',
        comparativeAnalysis: '작가가 의도한 침묵의 미학이 화면의 절제된 색채와 붓질의 톤 다운을 통해 시각적으로 완벽하게 일치하며 구현되어 있습니다.'
      },
      appreciationGuide: {
        focusPoints: [
          '가장 밝은 면과 어두운 면이 만나는 경계선에서 물감이 어떻게 부드럽게 번져 있는지 살펴보세요.',
          '한 걸음 물러나 캔버스 전체의 여백이 주는 무게 중심의 균형감을 느껴보세요.'
        ],
        reflectiveQuestions: [
          '이 작품이 뿜어내는 빛은 당신에게 따뜻한 위로로 다가오나요, 아니면 서늘한 고독으로 느껴지나요?',
          '당신만의 방에서 이 그림과 같은 침묵을 마주했던 순간이 있었나요?'
        ]
      }
    };
  }
};

window.ArtAiDocent = ArtAiDocent;
