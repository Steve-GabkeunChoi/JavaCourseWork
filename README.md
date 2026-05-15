# Java 문법 강의 및 객관식 평가 앱

Java 문법을 챕터별로 학습하고, 객관식 문제를 풀고, 자동 채점과 정답 해설을 확인하는 정적 웹 앱이다.

## 1. 주요 기능

- 챕터별 강의 내용 출력
- 챕터별 4지선다형 문제풀이
- 자동 채점
- 정답 해설 출력
- 강의, 문제풀이, 채점 및 분석 탭 분리
- JSON 모듈 기반 챕터 확장

## 2. 파일 구조

```text
java-grammar-module-tabs-app/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── data/
│   └── chapters/
│       ├── index.json
│       ├── overview.json
│       ├── variables.json
│       ├── conditions.json
│       ├── loops.json
│       └── classes.json
├── docs/
│   └── json-module-format.md
├── README.md
└── .gitignore
```

## 3. 챕터 로딩 방식

앱은 `data/chapters/index.json`을 먼저 읽는다.

```json
{
  "modules": [
    { "file": "overview.json" },
    { "file": "variables.json" }
  ]
}
```

그다음 `data/chapters/` 디렉토리 안의 각 JSON 모듈을 불러온다.

챕터 메뉴명은 각 JSON 파일의 `title` 값을 사용한다.

```json
{
  "id": "overview",
  "order": 1,
  "title": "개요"
}
```

화면에는 `개요`라는 챕터 버튼이 생성되고, 해당 챕터를 선택하면 개요 모듈의 강의, 문제풀이, 채점 및 분석 화면만 출력된다.

## 4. 실행 방법

GitHub Pages에 올리면 바로 실행할 수 있다.

로컬에서 확인할 때는 브라우저 보안 정책 때문에 파일을 직접 열지 말고 간단한 서버로 실행한다.

```bash
cd java-grammar-module-tabs-app
python3 -m http.server 8000
```

브라우저에서 접속한다.

```text
http://localhost:8000
```

## 5. 챕터 추가 방법

`data/chapters/`에 새 JSON 파일을 만든다.

예를 들어 `methods.json`을 추가한다.

```text
data/chapters/methods.json
```

그다음 `data/chapters/index.json`에 등록한다.

```json
{
  "modules": [
    { "file": "overview.json" },
    { "file": "variables.json" },
    { "file": "methods.json" }
  ]
}
```

이후 앱을 새로고침하면 `methods.json`의 `title` 값이 챕터 메뉴에 표시된다.

## 6. JSON 작성 기준

자세한 JSON 구조는 아래 파일에 정리되어 있다.

```text
docs/json-module-format.md
```

## 7. GitHub Pages 배포

1. GitHub 저장소를 생성한다.
2. 이 프로젝트 파일 전체를 업로드한다.
3. Settings 메뉴로 이동한다.
4. Pages 메뉴에서 배포 브랜치를 선택한다.
5. 배포 주소로 접속한다.

## 8. 주의 사항

정적 웹 환경에서는 브라우저 JavaScript만으로 서버 디렉토리 목록을 직접 읽을 수 없다. 그래서 이 앱은 `data/chapters/index.json`을 모듈 목록으로 사용한다. 챕터 파일은 `data/chapters/` 디렉토리에 두고, `index.json`에 등록하는 방식으로 확장한다.
