# Workstation Preflight

`scripts/workstation/preflight.ps1`은 DESKTOP과 LAPTOP에서 공통으로 사용하는 읽기 전용 Git/PC 상태 점검 스크립트입니다. 저장소 내부에서 실행하며, 원격 상태 확인을 위해 `git fetch origin --prune`만 수행합니다. commit, push, pull, merge, rebase, stash, reset, branch/worktree 변경은 하지 않습니다.

## 실행

저장소 root에서 Windows PowerShell로 실행합니다.

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\workstation\preflight.ps1
```

현재 PowerShell 세션에서 실행할 수 있다면 다음처럼 호출해도 됩니다.

```powershell
.\scripts\workstation\preflight.ps1
```

스크립트는 `%USERPROFILE%\.gyesanbox\workstation.json`을 읽어 workstation marker를 확인합니다. marker가 없거나 JSON이 잘못되었으면 각각 `WORKSTATION_MARKER_MISSING` 또는 `WORKSTATION_MARKER_INVALID`로 판정합니다. marker에 `computerName`(대소문자 무관) 필드가 있으면 현재 `$env:COMPUTERNAME`과 교차검증합니다. workstation 이름은 `workstation`, `workstationName`, `name`, `role`, `machine` 중 먼저 발견되는 필드를 사용합니다. 비밀값을 포함할 수 있는 marker 전체 내용은 출력하지 않습니다.

## 출력과 판정

`WORKSTATION`, `COMPUTERNAME`, `GIT_ROOT`, `WORKTREE`, `BRANCH`, `HEAD`, `ORIGIN`, `UPSTREAM`, staged/unstaged/untracked 개수, ahead/behind, `STATUS`, `SAFE_TO_CONTINUE`를 출력합니다. remote URL은 credential이 있으면 사용자 정보 부분을 `***`로 마스킹합니다.

최종 상태는 다음 우선순위로 결정됩니다.

`NOT_GIT_REPOSITORY` → `WORKSTATION_MISMATCH` → marker 오류 → `FETCH_FAILED` → `DETACHED_HEAD` → `DIRTY` → `NO_UPSTREAM` → `DIVERGED` → `LOCAL_AHEAD`/`REMOTE_AHEAD` → `SYNCED`

origin 자체가 없으면 `NO_ORIGIN`으로 판정합니다. (문서의 우선순위에서 origin 없음은 fetch 이후, branch/working tree 확인과 같은 Git 기본 검사가 가능한 경우에 적용됩니다.)

`SYNCED`일 때만 `SAFE_TO_CONTINUE: YES`입니다. 다른 상태에서는 자동 수정 없이 `NO`를 반환합니다.

## Exit code

| Code | Status |
| ---: | --- |
| 0 | `SYNCED` |
| 10 | `REMOTE_AHEAD` |
| 11 | `LOCAL_AHEAD` |
| 12 | `DIRTY` |
| 13 | `DIVERGED` |
| 14 | `NO_UPSTREAM` |
| 15 | `DETACHED_HEAD` |
| 20 | `WORKSTATION_MARKER_MISSING` |
| 21 | `WORKSTATION_MARKER_INVALID` |
| 22 | `WORKSTATION_MISMATCH` |
| 30 | `FETCH_FAILED` |
| 40 | `NOT_GIT_REPOSITORY` 또는 기타 Git 오류 |
| 41 | `NO_ORIGIN` |

PowerShell에서 종료 코드를 확인하려면 실행 직후 `$LASTEXITCODE`를 확인합니다.
