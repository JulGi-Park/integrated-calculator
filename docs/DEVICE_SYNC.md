# 노트북-데스크톱 작업 동기화

이 저장소는 두 PC에서 번갈아 작업할 때 WIP를 안전하게 주고받기 위해 두 개의 래퍼 명령을 제공합니다.

## 최초 1회 설정

1. 두 PC 모두 GitHub 인증이 되어 있어야 합니다.
2. 저장소를 같은 원격 저장소에서 clone합니다.
3. 각 PC에서 `restore-work.cmd release/vat-profit-260710`를 한 번 실행해 대상 브랜치를 맞춥니다.
4. 실제 `.env`, `.env.local`, 인증 파일, 토큰, 키 파일은 Git으로 동기화하지 않습니다. 1Password, GitHub Actions secrets, Windows Credential Manager 같은 별도 비밀관리 도구로 옮겨야 합니다.

## 작업 시작 절차

다른 PC에서 작업을 이어받을 때:

```cmd
restore-work.cmd release/vat-profit-260710
```

이 명령은 원격 브랜치를 가져오고, 현재 작업트리에 변경이 있으면 먼저 `backup/<컴퓨터명>/<현재브랜치>/YYYYMMDD-HHmmss` 브랜치로 백업 커밋과 push를 만든 뒤 대상 브랜치로 fast-forward만 수행합니다.

## 작업 종료 절차

현재 PC에서 작업을 마칠 때:

```cmd
backup-work.cmd
```

변경이 있으면 다음 형식의 체크포인트 커밋을 만들고 현재 브랜치를 origin에 push합니다.

```text
wip(<COMPUTERNAME>): checkpoint YYYY-MM-DD HH:mm
```

변경이 없으면 새 커밋을 만들지 않고 로컬과 원격 HEAD 일치 여부만 확인합니다.

## 노트북에서 데스크톱으로 전환하는 예

노트북에서:

```cmd
backup-work.cmd
```

데스크톱에서:

```cmd
restore-work.cmd release/vat-profit-260710
```

## 데스크톱에서 노트북으로 전환하는 예

데스크톱에서:

```cmd
backup-work.cmd
```

노트북에서:

```cmd
restore-work.cmd release/vat-profit-260710
```

## 충돌 시 처리

스크립트는 자동 병합을 하지 않습니다. 원격이 앞서 있거나 브랜치가 갈라졌거나 `git pull --ff-only`가 실패하면 즉시 중단합니다.

이 경우 먼저 어느 PC의 작업이 최신인지 확인하고, 필요한 백업 브랜치가 원격에 push되어 있는지 확인합니다. 파일을 직접 덮어쓰거나 파괴 명령으로 우회하지 않습니다.

## GitHub 인증 만료 시 처리

push 또는 fetch가 인증 오류로 실패하면 GitHub CLI, Git Credential Manager, 또는 사용하는 인증 도구에서 다시 로그인합니다.

```cmd
gh auth login
```

인증을 복구한 뒤 같은 명령을 다시 실행합니다. 인증 실패 중에는 수동으로 강제 push하지 않습니다.

## `.env`와 비밀 값

`.env`, `.env.local`, 인증 파일, 토큰, 키 파일은 백업 커밋 대상에서 차단됩니다. 환경 변수와 비밀 값은 별도 비밀관리 도구에 저장하고, 저장소에는 `.env.example`처럼 민감하지 않은 예시만 둡니다.

## 백업 브랜치 복구 방법

백업 브랜치 목록을 확인합니다.

```cmd
git branch -r --list "origin/backup/*"
```

필요한 백업 브랜치를 로컬로 가져옵니다.

```cmd
git switch --track -c backup/example origin/backup/example
```

내용을 확인한 뒤 필요한 파일만 현재 작업 브랜치로 가져옵니다.

```cmd
git switch release/vat-profit-260710
git restore --source backup/example -- path/to/file
```

## 절대 실행하지 말아야 할 명령

다음 명령은 다른 PC의 WIP나 현재 PC의 미커밋 작업을 잃게 만들 수 있으므로 동기화 문제 해결에 사용하지 않습니다.

```cmd
git reset --hard
git clean -fd
git push --force
git push --force-with-lease
git rebase
git stash
```
