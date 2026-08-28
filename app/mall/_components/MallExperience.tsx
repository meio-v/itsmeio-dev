"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  type MouseEvent,
} from "react";

import type { CurrentlyPlayingContent as CurrentlyPlayingContentType } from "@/lib/currently-playing";

import {
  initialMallExperienceState,
  mallExperienceReducer,
} from "../_lib/experience-state";
import type {
  SceneCommandPort,
  SceneEvent,
} from "../_lib/scene-contract";
import styles from "../mall.module.css";
import { CurrentlyPlayingContent } from "./CurrentlyPlayingContent";
import { CurrentlyPlayingDialog } from "./CurrentlyPlayingDialog";
import { MallSceneSlot } from "./MallSceneSlot";

const CURRENTLY_PLAYING_HASH = "#currently-playing";

export function MallExperience({
  content,
}: {
  content: CurrentlyPlayingContentType;
}) {
  const [state, dispatch] = useReducer(
    mallExperienceReducer,
    initialMallExperienceState,
  );
  const scenePort = useRef<SceneCommandPort | null>(null);
  const focusOrigin = useRef<HTMLElement | null>(null);
  const rideControl = useRef<HTMLButtonElement | null>(null);
  const pushedPanelHash = useRef(false);

  const openArcade = useCallback((origin?: HTMLElement | null) => {
    focusOrigin.current = origin ?? rideControl.current;
    dispatch({ type: "open-poi", id: "currently-playing" });
  }, []);

  const closeArcade = useCallback(() => {
    dispatch({ type: "close-poi" });

    if (window.location.hash === CURRENTLY_PLAYING_HASH) {
      if (pushedPanelHash.current) {
        pushedPanelHash.current = false;
        window.history.back();
      } else {
        window.history.replaceState(
          null,
          "",
          `${window.location.pathname}${window.location.search}`,
        );
      }
    }

    window.requestAnimationFrame(() => {
      if (state.runtimeStatus !== "unavailable" && state.resumeMode === "driving") {
        scenePort.current?.dispatch({ type: "set-control-mode", mode: "driving" });
        return;
      }
      focusOrigin.current?.focus();
    });
  }, [state.resumeMode, state.runtimeStatus]);

  const openFromLink = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      focusOrigin.current = event.currentTarget;
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
    const content = document.getElementById("mall-content");
    content?.focus({ preventScroll: true });
    content?.scrollIntoView({ block: "start" });
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
          if (event.id === "currently-playing") {
            if (window.location.hash !== CURRENTLY_PLAYING_HASH) {
              window.history.pushState(null, "", CURRENTLY_PLAYING_HASH);
              pushedPanelHash.current = true;
            }
            openArcade(rideControl.current);
          }
          return;
        case "control-mode-changed":
          dispatch({ type: "runtime-control-mode", mode: event.mode });
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
    scenePort.current?.dispatch({
      type: "set-control-mode",
      mode: state.controlMode,
    });
  }, [state.controlMode]);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () =>
      scenePort.current?.dispatch({
        type: "set-motion-mode",
        mode: query.matches ? "reduced" : "full",
      });
    syncMotion();
    query.addEventListener("change", syncMotion);
    return () => query.removeEventListener("change", syncMotion);
  }, [state.runtimeStatus]);

  const setScenePort = useCallback((port: SceneCommandPort | null) => {
    scenePort.current = port;
  }, []);

  const takeControl = () => {
    dispatch({
      type: state.controlMode === "driving" ? "pause-ride" : "take-control",
    });
    rideControl.current?.focus();
  };

  const toggleAttractMotion = () => {
    dispatch({
      type: state.controlMode === "attract" ? "pause-ride" : "resume-ride",
    });
  };

  const status =
    state.runtimeStatus === "ready"
      ? state.controlMode === "driving"
        ? "You have control"
        : state.controlMode === "paused"
          ? "Ride paused"
          : "Attract mode"
      : state.runtimeStatus === "unavailable"
        ? (state.runtimeMessage ?? "Ride unavailable")
        : state.runtimeStatus === "recovering"
          ? (state.runtimeMessage ?? "Restoring ride")
        : "Ride loading";

  return (
    <main className={styles.page}>
      <a className={styles.skipLink} href="#mall-content" onClick={skipRide}>
        Skip the ride
      </a>

      <header className={styles.header}>
        <Link className={styles.wordmark} href="/">
          ITSMEIO.DEV
        </Link>
        <nav aria-label="Site">
          <Link href="/">Main site</Link>
          <a href={CURRENTLY_PLAYING_HASH} onClick={openFromLink}>
            Currently playing
          </a>
          <a href="https://github.com/meio-v">GitHub</a>
        </nav>
      </header>

      <section className={styles.hero} aria-labelledby="mall-heading">
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Mall wing / after hours</p>
          <h1 id="mall-heading">Take the long way in.</h1>
          <p className={styles.welcome}>
            Hey! How are you? I hope you&apos;re having a great day. Welcome to
            my website. It has things I like—mostly games, tech, passing
            hobbies, and personal stuff. If you like those things, I recommend
            looking around.
          </p>
        </div>

        <div className={styles.rideFrame}>
          <MallSceneSlot
            featuredTitle={content.current?.title ?? null}
            onEvent={handleSceneEvent}
            onPortReady={setScenePort}
          />
          <div className={styles.rideHud}>
            <p className={styles.rideStatus} aria-live="polite">
              <span aria-hidden="true" /> {status}
            </p>
            <div className={styles.rideActions}>
              <button
                ref={rideControl}
                type="button"
                className={styles.primaryButton}
                disabled={state.runtimeStatus !== "ready"}
                aria-describedby="ride-controls-help"
                onClick={takeControl}
              >
                {state.controlMode === "driving"
                  ? "Pause ride"
                  : state.resumeMode === "driving" && state.controlMode === "paused"
                    ? "Resume ride"
                    : "Take control"}
              </button>
              {(state.controlMode === "attract" ||
                (state.controlMode === "paused" && state.resumeMode === "attract")) && (
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={toggleAttractMotion}
                >
                  {state.controlMode === "attract" ? "Pause motion" : "Resume motion"}
                </button>
              )}
              <a
                className={styles.secondaryButton}
                href={CURRENTLY_PLAYING_HASH}
                onClick={(event) => {
                  openFromLink(event);
                  scenePort.current?.dispatch({
                    type: "focus-poi",
                    id: "currently-playing",
                  });
                }}
              >
                Enter arcade
              </a>
            </div>
          </div>
        </div>

        <p id="ride-controls-help" className={styles.controlsHelp}>
          Ride with WASD or arrow keys. Brake with S or ↓. Press R to reset.
          Touch controls appear on touch screens. Tab always leaves the ride.
        </p>
      </section>

      <div id="mall-content" className={styles.contentGrid} tabIndex={-1}>
        <section
          id="currently-playing"
          className={styles.contentCard}
          aria-labelledby="currently-playing-title"
        >
          <div className={styles.cardHeading}>
            <div>
              <p className={styles.eyebrow}>Arcade cabinet 01</p>
              <h2 id="currently-playing-title">Currently playing</h2>
            </div>
            <a href={CURRENTLY_PLAYING_HASH} onClick={openFromLink}>
              Open panel
            </a>
          </div>
          <CurrentlyPlayingContent content={content} compact />
        </section>

        <aside className={styles.noteCard}>
          <p className={styles.eyebrow}>No ride required</p>
          <h2>The website still works.</h2>
          <p>
            The mall is optional. The links, words, and game log stay ordinary
            HTML whether the ride loads or not.
          </p>
          <Link href="/">Continue to the main site →</Link>
        </aside>
      </div>

      <footer className={styles.footer}>
        <span>© 2026 Meio</span>
        <Link href="/">Exit mall</Link>
      </footer>

      <CurrentlyPlayingDialog
        content={content}
        open={state.selectedPoi === "currently-playing"}
        onRequestClose={closeArcade}
      />
    </main>
  );
}
