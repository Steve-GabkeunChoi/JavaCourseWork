# JSON 모듈 작성 형식

이 앱은 `data/chapters/index.json`을 먼저 읽고, 그 안에 등록된 JSON 파일을 `data/chapters/` 디렉토리에서 불러온다.

## 1. 모듈 등록 파일

`data/chapters/index.json`

```json
{
  "modules": [
    { "file": "overview.json" },
    { "file": "variables.json" }
  ]
}
```

새 챕터를 추가하려면 `data/chapters/`에 JSON 파일을 추가한 뒤 `index.json`에 파일명을 등록한다.

## 2. 챕터 JSON 구조

```json
{
  "id": "overview",
  "order": 1,
  "title": "개요",
  "summary": "챕터 요약",
  "lecture": {
    "sections": [
      {
        "heading": "소제목",
        "paragraphs": [
          "설명 문장"
        ]
      }
    ],
    "examples": [
      {
        "title": "예제 제목",
        "code": "public class Main { }"
      }
    ]
  },
  "questions": [
    {
      "id": "overview-q1",
      "question": "문제 내용",
      "choices": {
        "A": "선택지 1",
        "B": "선택지 2",
        "C": "선택지 3",
        "D": "선택지 4"
      },
      "answer": "B",
      "explanation": "정답 해설"
    }
  ]
}
```

## 3. 화면 출력 기준

- `title`은 좌측 챕터 메뉴와 메인 제목으로 출력된다.
- `summary`는 챕터 제목 아래 설명으로 출력된다.
- `lecture.sections`와 `lecture.examples`는 강의 탭에 출력된다.
- `questions`는 문제풀이 탭에 출력된다.
- 채점 결과와 해설은 채점 및 분석 탭에 출력된다.
