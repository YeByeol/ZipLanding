# ZIP 편안한 전체 동작 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 장면 경계의 viewport 순간이동/패널 hardcut/시간축 불일치를 없애고 시작부터 끝까지 읽는 리듬을 정리한다.
**Architecture:** shared pure timeline→camera/color/DOM opacity. Story applies exact frames; experience retains damping. CSS has one invariant art viewport and stable copy/readout zones. Lower page uses normal flow with no repeated reveal effects.
**Tech Stack:** existingvanillaHTML/CSS/Three0.187, Node test, Pages. Newdependency없음.
**Spec:** docs/superpowers/specs/2026-11-12-zip-comfortable-motion.md

## Global Constraints
- 제품계산/URL/선택/담기/공유/키보드/가상예시 유지, scroll은제품state불변.
- phase별canvas위치/크기/CSStransform교체금지, stablebreakpoint별clientrect.
- timeline경계1/6,.5,5/6±.06; smootherstep; phasehysteresis±.012.
- 같은progress의camera/colors/opacity는접근방향무관. readingholds정지.
- reduced/lowheight/JSoff/SVG본글·값누락금지, primitiveAPIguards보존.

## Review Focus
- 실제±2px왕복에서resize/panel/mode토글과whiteflash가없음.
- storyexactframe이experience수동camera/damping을건드리지않음.
- darkouter/brightUI에서글자·disabled·hover·선택대비일치.
- panelopacity0/hidden/aria원칙과H1/phaseCTA focus보존.
- introexit/reentry/resize/fastseek, missingX/20peer/empty 상태가안정적.

### Task1: 통합timeline·renderer·전체motion
**Files:** new scripts/story-timeline.mjs/tests/story-timeline.test.mjs; scripts/story.mjs/scene-model.mjs/scene3d.mjs/city.mjs/motion.mjs/main.mjs/package.json andrelatedtests.
**Interface:** storyTimeline(progress,previousPhase) returns {phase,from,to,blend,opacities:[4]}; from/to arephase names, modes mappingexported. LayoutfixedsoCSSvarsnoneexceptpanelopacity; timelinepurehistoryonlylogicalphaseaffected. presentationForProgressusesnewtimelineweights+spec4cameraheldposes.
- [ ] RED tests forhold/continuousderivatives/reverse/jitter/seek, colorblendendpoints/SVGinplace, paneldisplaythroughfade, reduced/lowheight, rendererstoryexactvsinteractiveguard.
- [ ] Shared blend helper in city module; renderSVG colors inplace using same transition. WebGLcolor/cameraexactforstory only, no105mstracking; preserveexperiencerendering/lifecycle.
- [ ] Controllersetsopacityforvisiblepanels, hiddendefinedonlyatopacity0, logicalmetadatahysteretic; legendsblendfromsameprogress. No perphasegeometrywrites. Updatecamera/stateonlyifframechanges.
- [ ] RemovegenericsectionrevealfrommountMotion+CSSunusedanimation. Keepreadingprogress/nav/reducedcallback, passivebatchedscroll andeventcleanup. NoadditionalpermanentrAF.
- [ ] Allregressions+newtests/check/export pass; addsyntaxnewmodule; version2.1.0.

### Task2: 고정 구도와 전체 밝기
**Files:** index.html/styles.css only.
- [ ] Readspecandcurrentfirst/cameraart; replacephasegeometryselectorswithonefixedviewportperbreakpoint. Allcopytopcenter/readoutbottomconsistent; opacityiscontrollerowned, noCSStransitionchasingprogress.
- [ ] Darksurroundthroughintro/experience/comparison/closing; realproductUIandcomparisonvaluesremainboundedreadablesurfaces. Nighttext/Logo-light, nosecondtokensystem.
- [ ] Removeallrepeateddata-revealCSSanimationandartentrancekeyframes. Keepbuttonfeedback150–220ms; reducedremovesunneededmovement.
- [ ] InitialnoJSall4panelsvisiblewithstaticSVGandcorrectscorelegend, allIDs/datafields preserved. 320/375/390+lowheightnooverlap/overflow. Rootactualscreensverify.

### Task3: 처음부터 끝까지 검증과 공개
**Files:** README/docs/verification andscopedfixes.
- [ ] Freshspec/codereview; actualbefore/afterboundarytrace(client/canvasdimensions, phasejitter, opacity/color/cameraalignment).
- [ ] Batched1440/768/390 visualtrajectory+compact320x640, reduced/lowheight/SVG/JSoff, all32previousbehavior+newtimelineconditions.
- [ ] Nativecontinuousscrollvideo+fastback/reverse; slider/selection/saved/share/focus/manualcamera/touch. AXE/sourcechecks; sourcefactsandrealdeviceFPSlimits.
- [ ] Commit/ffmain/pushauthorizedPages, Actionssuccess, publicsamebehaviors+assets, receiptcommitandcleanup.
