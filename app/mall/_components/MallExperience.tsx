"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useReducer, useRef, type MouseEvent } from "react";

import type { CurrentlyPlayingContent as CurrentlyPlayingContentType } from "@/lib/currently-playing";

import { initialMallExperienceState, mallExperienceReducer } from "../_lib/experience-state";
import type { SceneCommandPort, SceneEvent } from "../_lib/scene-contract";
import styles from "../mall.module.css";
import { CurrentlyPlayingContent } from "./CurrentlyPlayingContent";
import { CurrentlyPlayingDialog } from "./CurrentlyPlayingDialog";
import { MallSceneSlot } from "./MallSceneSlot";

const CURRENTLY_PLAYING_HASH = "#currently-playing";

const CABINET_TEXTURES = {
  marquee: true,
  controlPanel: true,
  screenGlass: true,
  body: true,
} as const;

export function MallExperience({ content }: { content: CurrentlyPlayingContentType }) {
  const [state, dispatch] = useReducer(mallExperienceReducer, initialMallExperienceState);
  const scenePort = useRef<SceneCommandPort | null>(null);
  const controlModeRef = useRef(state.controlMode);
  const focusOrigin = useRef<HTMLElement | null>(null);
  const tokenControl = useRef<HTMLButtonElement | null>(null);
  const pushedPanelHash = useRef(false);

  const openArcade = useCallback(
    (origin?: HTMLElement | null, restoreMode?: "attract" | "driving") => {
      focusOrigin.current = origin ?? tokenControl.current;
      dispatch({ type: "open-poi", id: "currently-playing", restoreMode });
    },
    [],
  );

  const closeArcade = useCallback(() => {
    dispatch({ type: "close-poi" });
    if (window.location.hash === CURRENTLY_PLAYING_HASH) {
      if (pushedPanelHash.current) {
        pushedPanelHash.current = false;
        window.history.back();
      } else {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
      }
    }
    window.requestAnimationFrame(() => {
      (focusOrigin.current ?? tokenControl.current)?.focus();
    });
  }, []);

  const openFromLink = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      if (window.location.hash !== CURRENTLY_PLAYING_HASH) {
        window.history.pushState(null, "", CURRENTLY_PLAYING_HASH);
        pushedPanelHash.current = true;
      }
      openArcade(event.currentTarget);
    },
    [openArcade],
  );

  const skipRide = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const contentRegion = document.getElementById("currently-playing");
    contentRegion?.focus({ preventScroll: true });
    contentRegion?.scrollIntoView({ block: "start" });
  }, []);

  const handleSceneEvent = useCallback(
    (event: SceneEvent) => {
      switch (event.type) {
        case "runtime-ready":
          dispatch({ type: "runtime-ready" });
          return;
        case "runtime-interrupted":
          dispatch({ type: "runtime-interrupted", reason: event.reason });
          return;
        case "runtime-unavailable":
          dispatch({ type: "runtime-unavailable", reason: event.reason });
          return;
        case "entered-poi":
          if (window.location.hash !== CURRENTLY_PLAYING_HASH) {
            window.history.pushState(null, "", CURRENTLY_PLAYING_HASH);
            pushedPanelHash.current = true;
          }
          openArcade(tokenControl.current, "attract");
          return;
        case "control-mode-changed":
          dispatch({ type: "runtime-control-mode", mode: event.mode });
          if (event.mode === "attract") {
            window.requestAnimationFrame(() => {
              const activeElement = document.activeElement;
              if (
                activeElement === document.body ||
                activeElement?.classList.contains("mall-ride-surface")
              ) {
                tokenControl.current?.focus();
              }
            });
          }
      }
    },
    [openArcade],
  );

  useEffect(() => {
    const syncPanelToHash = () => {
      if (window.location.hash === CURRENTLY_PLAYING_HASH) {
        openArcade(focusOrigin.current);
      } else if (state.selectedPoi === "currently-playing") {
        dispatch({ type: "close-poi" });
        window.requestAnimationFrame(() => focusOrigin.current?.focus());
      }
    };
    syncPanelToHash();
    window.addEventListener("hashchange", syncPanelToHash);
    window.addEventListener("popstate", syncPanelToHash);
    return () => {
      window.removeEventListener("hashchange", syncPanelToHash);
      window.removeEventListener("popstate", syncPanelToHash);
    };
  }, [openArcade, state.selectedPoi]);

  useEffect(() => {
    controlModeRef.current = state.controlMode;
    scenePort.current?.dispatch({ type: "set-control-mode", mode: state.controlMode });
  }, [state.controlMode]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => scenePort.current?.dispatch({
      type: "set-motion-mode",
      mode: query.matches ? "reduced" : "full",
    });
    syncMotion();
    query.addEventListener("change", syncMotion);
    return () => query.removeEventListener("change", syncMotion);
  }, [state.runtimeStatus]);

  const setScenePort = useCallback((port: SceneCommandPort | null) => {
    scenePort.current = port;
    port?.dispatch({ type: "set-control-mode", mode: controlModeRef.current });
  }, []);

  const attractPaused = state.controlMode === "paused" && state.resumeMode === "attract";
  const showAttractControls = state.controlMode === "attract" || attractPaused;
  const status = state.runtimeStatus === "ready"
    ? state.controlMode === "driving"
      ? "RIDE ACTIVE"
      : attractPaused ? "ATTRACT PAUSED" : "ATTRACT MODE"
    : state.runtimeStatus === "unavailable"
      ? (state.runtimeMessage ?? "RIDE UNAVAILABLE")
      : state.runtimeStatus === "recovering"
        ? (state.runtimeMessage ?? "RESTORING RIDE")
        : "LOADING RIDE";

  return (
    <main className={styles.page}>
      <a className={styles.skipLink} href="#currently-playing" onClick={skipRide}>Skip the ride</a>

      <header className={styles.header}>
        <div className={styles.utilityRail}>
          <Link href="/">itsmeio.dev</Link>
        </div>
        <span className={styles.headerRule} aria-hidden="true" />
        <nav className={styles.navGrid} aria-label="Site">
          <div className={styles.navPlate}>
            <span className={styles.navUnderplate} aria-hidden="true" />
            <Link className={`${styles.navLink} ${styles.navWork}`} href="/">
              <span className={styles.playerBadge}>1P</span>
              <strong>Work</strong>
              <small>仕事 / WORK WING</small>
            </Link>
          </div>
          <div className={styles.navPlate}>
            <span className={styles.navUnderplate} aria-hidden="true" />
            <a className={`${styles.navLink} ${styles.navPlaying}`} href={CURRENTLY_PLAYING_HASH} onClick={openFromLink}>
              <span className={styles.playerBadge}>2P</span>
              <strong>Playing</strong>
              <small>現在プレイ中 / NOW PLAYING</small>
            </a>
          </div>
          <div className={styles.navPlate}>
            <span className={styles.navUnderplate} aria-hidden="true" />
            <a className={`${styles.navLink} ${styles.navResume}`} href="https://www.linkedin.com/in/meio/">
              <span className={styles.playerBadge}>3P</span>
              <strong>Résumé</strong>
              <small>履歴書 / CV</small>
            </a>
          </div>
          <div className={styles.navPlate}>
            <span className={styles.navUnderplate} aria-hidden="true" />
            <a className={`${styles.navLink} ${styles.navGithub}`} href="https://github.com/meio-v">
              <span className={styles.playerBadge}>4P</span>
              <strong>GitHub</strong>
              <small>ソースコード / SOURCE</small>
            </a>
          </div>
        </nav>
      </header>

      <section className={styles.hero} aria-labelledby="mall-heading">
        <span className={styles.heroPolygon} aria-hidden="true" />
        <span className={styles.heroTone} aria-hidden="true" />
        <span className={styles.sectionNumber} data-number="01" aria-hidden="true">01</span>
        <h1 id="mall-heading" className={styles.wordmark}>
          <span>It&apos;s Meio.</span>
          <span>(The)<b>Dev</b></span>
        </h1>
        <div className={styles.welcomeStage}>
          <span className={styles.welcomeUnderplate} aria-hidden="true" />
          <div className={styles.welcome}>
            <span className={styles.welcomeTone} aria-hidden="true" />
            <p>
              Hey! How are you? I hope you&apos;re having a great day. Welcome to my website.
              It has things I like—mostly games, tech, passing hobbies, and personal stuff.
              If you like those things, I recommend looking around.
            </p>
          </div>
        </div>
        <div className={styles.entryPaths}>
          <p className={styles.routeCue}><span aria-hidden="true" />Take the long way in</p>
          <a href={CURRENTLY_PLAYING_HASH} onClick={openFromLink}>or go straight to the arcade →</a>
        </div>
        <Image
          className={`${styles.pageSticker} ${styles.heroMascotSticker}`}
          src="/mall/stickers/mascot-janitor.png"
          alt=""
          width={1344}
          height={1344}
          aria-hidden="true"
          draggable={false}
        />
        <p className={styles.routeMeta} aria-hidden="true">
          <span className={styles.routeJapanese}>深夜営業中</span>
          <span className={styles.routeRomaji}> / MALL WING 01 — AFTER HOURS / NO COIN NEEDED</span>
        </p>
      </section>

      <div className={styles.ticker} aria-hidden="true">
        <div>
          <span>Welcome to my website ★ Look around ★ ようこそ ★ It&apos;s Meio.(The)Dev ★ </span>
          <span>Welcome to my website ★ Look around ★ ようこそ ★ It&apos;s Meio.(The)Dev ★ </span>
        </div>
      </div>

      <section className={styles.rideSection} aria-label="Playable mall wing">
        <span className={`${styles.sectionNumber} ${styles.rideNumber}`} data-number="02" aria-hidden="true">02</span>
        <Image
          className={`${styles.rideSticker} ${styles.mopedSticker}`}
          src="/mall/stickers/moped.png"
          alt=""
          width={768}
          height={702}
          aria-hidden="true"
          draggable={false}
        />
        <Image
          className={`${styles.rideSticker} ${styles.vendoSticker}`}
          src="/mall/stickers/vendo.png"
          alt=""
          width={576}
          height={768}
          aria-hidden="true"
          draggable={false}
        />
        <div className={styles.rideSectionInner}>
          <h2>Come explore with me<span>.</span></h2>
          <div className={styles.cabinetStage}>
            <Image
              className={`${styles.pageSticker} ${styles.tokenSticker}`}
              src="/mall/stickers/doodles/free-play-token.png"
              alt=""
              width={318}
              height={319}
              aria-hidden="true"
              draggable={false}
            />
            <span className={styles.cabinetUnderplate} aria-hidden="true" />
            <div
              className={styles.rideFrame}
              data-driving={state.controlMode === "driving"}
              data-control-mode={state.controlMode}
              data-texture-marquee={CABINET_TEXTURES.marquee ? "on" : "off"}
              data-texture-control-panel={CABINET_TEXTURES.controlPanel ? "on" : "off"}
              data-texture-screen-glass={CABINET_TEXTURES.screenGlass ? "on" : "off"}
              data-texture-body={CABINET_TEXTURES.body ? "on" : "off"}
            >
              <span className={`${styles.cabinetTexture} ${styles.cabinetBodyTexture}`} aria-hidden="true" />
              <div className={styles.cabinetMarquee}>
                <span className={`${styles.cabinetTexture} ${styles.marqueeTexture}`} aria-hidden="true" />
                <strong>After Hours Mall</strong>
                <small>ゲームコーナー・深夜営業</small>
              </div>

              <div className={styles.cabinetStatusBar}>
                <span>MOPED RIDE / CABINET 02 / 原付</span>
                <div>
                  <p className={styles.rideStatus} aria-live="polite"><span aria-hidden="true" /> {status}</p>
                  {showAttractControls && (
                    <button
                      type="button"
                      className={styles.pauseButton}
                      disabled={state.runtimeStatus !== "ready"}
                      onClick={() => dispatch({ type: attractPaused ? "resume-attract" : "pause-attract" })}
                    >
                      {attractPaused ? "Resume" : "Pause"}
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.cabinetScreenRow}>
                <div className={`${styles.cabinetSidePanel} ${styles.cabinetSideLeft}`} aria-hidden="true">
                  <span className={styles.serialPlate}>MDL. MP-01 / 100V 60Hz</span>
                </div>
                <div className={styles.screenViewport}>
                  <span
                    className={styles.visuallyHidden}
                    role="img"
                    aria-label="Third-person moped ride through an after-hours mall"
                  />
                  <MallSceneSlot
                    featuredTitle={content.current?.title ?? null}
                    onEvent={handleSceneEvent}
                    onPortReady={setScenePort}
                  />
                  <span className={`${styles.cabinetTexture} ${styles.screenGlassTexture}`} aria-hidden="true" />
                  {state.runtimeStatus === "ready" && showAttractControls && !state.selectedPoi && (
                    <span className={styles.insertCoin} aria-hidden="true">Insert coin</span>
                  )}
                </div>
                <div className={`${styles.cabinetSidePanel} ${styles.cabinetSideRight}`} aria-hidden="true">
                  <span className={styles.maintenanceSticker}>INSP. 08/26</span>
                </div>
              </div>

              <div className={styles.controlPanel}>
                <span className={`${styles.cabinetTexture} ${styles.controlPanelTexture}`} aria-hidden="true" />
                <div className={styles.tokenConsole}>
                  <div className={styles.controlHardware}>
                    <div className={styles.coinDoorAssembly}>
                      <Image
                        className={styles.coinDoorArt}
                        src="/mall/textures/coin-door.png"
                        alt=""
                        width={800}
                        height={1000}
                        aria-hidden="true"
                        draggable={false}
                      />
                      <span className={styles.coinFreePlate} aria-hidden="true">
                        <b>FREE</b>
                        <small>1 PLAY</small>
                      </span>
                      <span className={styles.coinInsertDisplayShade} aria-hidden="true" />
                      <button
                        ref={tokenControl}
                        type="button"
                        className={styles.coinUnit}
                        disabled={!showAttractControls || state.runtimeStatus !== "ready"}
                        aria-label="Add token"
                        aria-describedby="ride-controls-help"
                        onClick={() => dispatch({ type: "insert-token" })}
                      >
                        <span className={styles.visuallyHidden}>Add token</span>
                      </button>
                    </div>
                    <div className={styles.controlDeckMount} aria-hidden="true">
                      <Image
                        className={styles.controlDeckArt}
                        src="/mall/textures/control-deck-panel.png"
                        alt=""
                        width={1480}
                        height={620}
                        draggable={false}
                      />
                    </div>
                  </div>
                  <p id="ride-controls-help" className={styles.visuallyHidden}>
                    Activate the coin slot to start the ride. Use the arrow keys or WASD to steer,
                    S or the down arrow to brake, R to reset, and Tab or Escape to exit. On a
                    touchscreen, ride controls appear over the game screen.
                  </p>
                  <div className={styles.serviceRail}>
                    <p className={styles.controlPlate}>
                      <span><b>← → / WASD</b> — STEER</span>
                      <i aria-hidden="true">·</i>
                      <span><b>S / ↓</b> — BRAKE</span>
                      <i aria-hidden="true">·</i>
                      <span><b>R</b> — RESET</span>
                      <i aria-hidden="true">·</i>
                      <span><b>TAB / ESC</b> — EXIT</span>
                    </p>
                    <span className={styles.hardwareLabels} aria-hidden="true">
                      DO NOT SIT ON CABINET / 遊技中の飲食はご遠慮ください
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="currently-playing" className={styles.kiosk} tabIndex={-1} aria-labelledby="currently-playing-title">
        <span className={`${styles.sectionNumber} ${styles.kioskNumber}`} data-number="03" aria-hidden="true">03</span>
        <div className={styles.kioskInner}>
          <div className={styles.kioskServiceStrip} aria-hidden="true"><span>03 / POSTER WALL</span><span>CABINET 01</span></div>
          <div className={styles.kioskScreenStage}>
            <Image
              className={styles.playstationSticker}
              src="/mall/stickers/playstation.png"
              alt=""
              width={768}
              height={768}
              aria-hidden="true"
              draggable={false}
            />
            <div className={styles.kioskScreen}>
              <span className={styles.kanaRail} aria-hidden="true">現在プレイ中</span>
              <div className={styles.kioskHeading}>
                <h2 id="currently-playing-title"><span>Currently</span><span>Playing</span></h2>
                <a href={CURRENTLY_PLAYING_HASH} onClick={openFromLink}>Open display →</a>
              </div>
              <CurrentlyPlayingContent content={content} compact />
            </div>
          </div>
          <Image
            className={`${styles.pageSticker} ${styles.helmetSticker}`}
            src="/mall/stickers/doodles/moped-helmet.png"
            alt=""
            width={434}
            height={515}
            aria-hidden="true"
            draggable={false}
          />
          <div className={styles.visitorNote} aria-hidden="true">
            <span>THANK YOU FOR VISIT — PLEASE ENJOY LOOKING</span>
            <small>ごゆっくりどうぞ</small>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>It&apos;s Meio.(The)Dev</span>
        <nav aria-label="Footer">
          <Link href="/">Work</Link>
          <a href={CURRENTLY_PLAYING_HASH} onClick={openFromLink}>Playing</a>
          <a href="https://www.linkedin.com/in/meio/">Résumé</a>
          <a href="https://github.com/meio-v">GitHub</a>
        </nav>
      </footer>

      <CurrentlyPlayingDialog content={content} open={state.selectedPoi === "currently-playing"} onRequestClose={closeArcade} />
    </main>
  );
}
