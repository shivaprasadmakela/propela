import React, { useState, useEffect, useCallback, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhone,
  faPhoneSlash,
  faMicrophone,
  faMicrophoneSlash,
  faPause,
  faPlay,
  faPhoneVolume,
  faChevronUp,
  faChevronDown,
  faPlug,
  faHeadset,
  faRotate,
  faCheck,
  faClock,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { telephonyApi } from "@/domains/settings/api/telephonyApi";

declare global {
  interface Window {
    ExotelCRMWebSDK?: any;
    initExotelSoftphone?: (token: string, userId: string, autoConnect?: boolean) => Promise<any>;
    exotelDial?: (number: string, customField?: string) => boolean;
    exotelAnswer?: () => boolean;
    exotelHangup?: () => boolean;
    exotelToggleMute?: () => boolean;
    exotelToggleHold?: () => boolean;
    __exotelPhone?: any;
    __exotelStatus?: any;
  }
}

interface CallSummary {
  number: string;
  duration: number;
  direction: "INBOUND" | "OUTBOUND";
  endedAt: string;
  status: "Completed" | "Missed" | "Busy" | "Cancelled";
}

export function ExotelSoftphoneWidget() {
  const [isOpen, setIsOpen] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [agentEmail, setAgentEmail] = useState<string>("Rajesh.G@modlix.com");
  const [dialNumber, setDialNumber] = useState("09701191800");
  const [callState, setCallState] = useState<"IDLE" | "DIALING" | "RINGING" | "CONNECTED" | "ENDED">("IDLE");
  const [callerNumber, setCallerNumber] = useState<string>("");
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);
  const [duration, setDuration] = useState(0);
  const [callSummary, setCallSummary] = useState<CallSummary | null>(null);
  const [callDirection, setCallDirection] = useState<"INBOUND" | "OUTBOUND">("OUTBOUND");

  const isConnectingRef = useRef(false);
  const durationRef = useRef(0);
  const callerNumberRef = useRef("");
  const dialNumberRef = useRef("09701191800");
  const callDirectionRef = useRef<"INBOUND" | "OUTBOUND">("OUTBOUND");

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    callerNumberRef.current = callerNumber;
  }, [callerNumber]);

  useEffect(() => {
    dialNumberRef.current = dialNumber;
  }, [dialNumber]);

  useEffect(() => {
    callDirectionRef.current = callDirection;
  }, [callDirection]);

  const endCallSession = useCallback((statusOverride?: "Completed" | "Missed" | "Busy" | "Cancelled") => {
    const finalDuration = durationRef.current;
    const num = callerNumberRef.current || dialNumberRef.current || "Unknown";
    const status = statusOverride || (finalDuration > 0 ? "Completed" : "Missed");

    setCallSummary({
      number: num,
      duration: finalDuration,
      direction: callDirectionRef.current,
      endedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status,
    });
    setCallState("ENDED");
    setIsMuted(false);
    setIsOnHold(false);
  }, []);

  const connectSoftphone = useCallback(async () => {
    if (isConnectingRef.current || window.__exotelStatus?.registered) return;
    isConnectingRef.current = true;
    setIsInitializing(true);
    setErrorMessage(null);
    //  const hardcodedToken = "qqqqeyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJZCI6ImYyZWE2OGQ5LWY4YjgtNGM2My05NTUzLWI3NzJlNjM0OGFlMCIsImV4cCI6MTc5NjI3Mzc4OX0.TIVEcD8X9p7aHaXr85cNIB0HQlQjXndp6JVxxsK3WXs";

    try {
      let jwtToken = "";
      let agentUser = "";

      try {
        const tokenRes = await telephonyApi.getBrowserToken("exotel_connection");
        console.log("🔑 Received Browser Call Token Response:", tokenRes);
        jwtToken = tokenRes?.token || tokenRes?.accessToken || "";
        agentUser = tokenRes?.providerUserId || tokenRes?.agentId || "";
      } catch (apiErr: any) {
        console.error("❌ Failed to fetch browser token from API:", apiErr);
        setIsRegistered(false);
        const errDetail =
          apiErr?.response?.data?.message ||
          apiErr?.message ||
          "Failed to fetch WebRTC token. Verify agent setup in Settings.";
        if (
          errDetail.includes("not provisioned") ||
          errDetail.includes("AGENT_NOT_PROVISIONED") ||
          apiErr?.response?.status === 403 ||
          apiErr?.response?.status === 404
        ) {
          setErrorMessage(
            "Your account is not provisioned for WebRTC calling yet. Go to Settings > Telephony > Exotel > Team Members tab and click Enable Calling."
          );
        } else {
          setErrorMessage(errDetail);
        }
        return;
      }

      if (!jwtToken) {
        setIsRegistered(false);
        setErrorMessage(
          "Could not obtain WebRTC token. Ensure agent is provisioned in Settings > Telephony > Exotel."
        );
        return;
      }

      if (agentUser) {
        setAgentEmail(agentUser);
      }

      if (typeof window.initExotelSoftphone === "function") {
        console.log("Connecting softphone for agent:", agentUser);
        const phone = await window.initExotelSoftphone(jwtToken, agentUser, true);
        console.log("📞 Exotel Softphone initialized, awaiting registration status...", phone);
        window.__exotelPhone = phone;
        // Registration state will be updated asynchronously via handleRegisterEvent
      } else {
        setIsRegistered(false);
        setErrorMessage("Exotel SDK is not ready yet. Please try again.");
      }
    } catch (err: any) {
      console.error("❌ Softphone Live Connection Error:", err);
      setIsRegistered(false);
      const msg = err?.message || "";
      if (msg.includes("not provisioned") || msg.includes("AGENT_NOT_PROVISIONED") || msg.includes("403")) {
        setErrorMessage(
          "Your account is not provisioned for WebRTC calling yet. Go to Settings > Telephony > Exotel > Team Members tab and click Enable Calling."
        );
      } else {
        setErrorMessage(msg || "Failed to connect softphone. Check agent setup in Telephony Settings.");
      }
    } finally {
      setIsInitializing(false);
      isConnectingRef.current = false;
    }
  }, []);

  useEffect(() => {
    // 1. Inject crmBundle.js if not already present
    if (!document.getElementById("exotel-crm-sdk-js")) {
      const s = document.createElement("script");
      s.id = "exotel-crm-sdk-js";
      s.async = true;
      s.onload = () => {
        s.setAttribute("data-loaded", "true");
        window.dispatchEvent(new CustomEvent("exotelSdkReady"));
      };
      s.src = "/crmBundle.js";
      (document.head || document.documentElement).appendChild(s);
    }

    function ensure(cb: () => void) {
      if (typeof window.ExotelCRMWebSDK !== "undefined") {
        cb();
        return;
      }
      const s = document.getElementById("exotel-crm-sdk-js");
      if (s && s.getAttribute("data-loaded") === "true") {
        cb();
        return;
      }
      let resolved = false;
      function done() {
        if (resolved) return;
        resolved = true;
        cb();
      }
      if (s) s.addEventListener("load", done);
      window.addEventListener("exotelSdkReady", done);
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (typeof window.ExotelCRMWebSDK !== "undefined") {
          clearInterval(interval);
          done();
        } else if (attempts > 50) {
          clearInterval(interval);
        }
      }, 100);
    }

    window.__exotelPhone = window.__exotelPhone || null;
    window.__exotelStatus = window.__exotelStatus || {
      registered: false,
      inCall: false,
      isMuted: false,
      isOnHold: false,
      lastEvent: null,
    };

    window.initExotelSoftphone = function (accessToken: string, userId: string, autoConnect?: boolean) {
      return new Promise(function (resolve, reject) {
        ensure(function () {
          try {
            if (typeof window.ExotelCRMWebSDK === "undefined") {
              reject(new Error("ExotelCRMWebSDK failed to load."));
              return;
            }

            // URL-encode "+" in query parameters so Exotel does not treat + as space (e.g. shivaprasad.m+fin@modlix.com)
            if (!(window as any).__exotelPatched) {
              (window as any).__exotelPatched = true;
              const origOpen = XMLHttpRequest.prototype.open;
              XMLHttpRequest.prototype.open = function (method: any, url: any, ...rest: any[]) {
                if (typeof url === "string" && url.includes("usermapping") && url.includes("+")) {
                  url = url.replace(/\+/g, "%2B");
                }
                return origOpen.apply(this, [method, url, ...rest] as any);
              };

              const origFetch = window.fetch;
              window.fetch = function (input: any, init: any) {
                if (typeof input === "string" && input.includes("usermapping") && input.includes("+")) {
                  input = input.replace(/\+/g, "%2B");
                }
                return origFetch.apply(window, [input, init] as any);
              };
            }
            const crmWebSDK = new window.ExotelCRMWebSDK(accessToken, userId, autoConnect !== false);

            function handleCallEvents(event: any, data: any) {
              console.log("📞 Exotel SDK Raw Event:", event, data);
              const detailObj = typeof event === "object" ? event : { event, data };
              window.__exotelStatus.lastEvent = detailObj;
              window.dispatchEvent(new CustomEvent("exotelCallEvent", { detail: detailObj }));
            }

            function handleRegisterEvent(event: any) {
              console.log("📞 Exotel Registration Event:", event);
              window.__exotelStatus.registered = event.status === "registered";
              window.dispatchEvent(new CustomEvent("exotelRegisterEvent", { detail: event }));
            }

            crmWebSDK
              .Initialize(handleCallEvents, handleRegisterEvent)
              .then(function (phone: any) {
                window.__exotelPhone = phone;
                resolve(phone);
              })
              .catch(function (err: any) {
                window.__exotelStatus.registered = false;
                window.dispatchEvent(
                  new CustomEvent("exotelRegisterEvent", {
                    detail: { status: "failed", message: err?.message || "SDK initialization failed" },
                  })
                );
                reject(err);
              });
          } catch (e) {
            window.__exotelStatus.registered = false;
            window.dispatchEvent(
              new CustomEvent("exotelRegisterEvent", {
                detail: { status: "failed", message: (e as any)?.message || "SDK load error" },
              })
            );
            reject(e);
          }
        });
      });
    };

    window.exotelDial = function (number: string, customField?: string) {
      if (!window.__exotelPhone) {
        console.error("Exotel softphone not initialized.");
        return false;
      }
      try {
        return window.__exotelPhone.MakeCall(
          number,
          function (dialStatus: any) {
            window.dispatchEvent(new CustomEvent("exotelDialEvent", { detail: dialStatus }));
          },
          customField || ""
        );
      } catch (err) {
        console.error("MakeCall error:", err);
        return false;
      }
    };

    window.exotelAnswer = function () {
      return window.__exotelPhone ? window.__exotelPhone.AcceptCall() : false;
    };

    window.exotelHangup = function () {
      return window.__exotelPhone ? window.__exotelPhone.HangupCall() : false;
    };

    window.exotelToggleMute = function () {
      return window.__exotelPhone ? window.__exotelPhone.ToggleMute() : false;
    };

    window.exotelToggleHold = function () {
      return window.__exotelPhone ? window.__exotelPhone.ToggleHold() : false;
    };

    const handleCallEvent = (e: any) => {
      const callData = e.detail || {};
      console.log("📞 Softphone Event:", callData);

      const rawState = (
        callData.state ||
        callData.event ||
        callData.data?.state ||
        callData.data?.event ||
        callData.data?.callState ||
        (Array.isArray(callData.eventType) ? callData.eventType[0] : callData.eventType) ||
        ""
      ).toString().toLowerCase();

      const remoteNum =
        callData.callFromNumber ||
        callData.number ||
        callData.from ||
        callData.data?.remoteId ||
        callData.data?.remoteDisplayName;

      if (remoteNum) {
        setCallerNumber(remoteNum);
        callerNumberRef.current = remoteNum;
      }

      const isRinging = ["ringing", "incoming", "i_new_call", "incomingcall"].some((s) => rawState.includes(s));
      const isConnected = ["established", "connected", "talking", "answered", "active"].some((s) => rawState.includes(s));
      const isEnded = [
        "callended",
        "ended",
        "terminated",
        "failed",
        "rejected",
        "hangup",
        "disconnected",
        "calldisconnected",
        "missed",
        "busy",
        "declined",
        "bye",
      ].some((s) => rawState.includes(s));

      if (isRinging) {
        setCallDirection("INBOUND");
        callDirectionRef.current = "INBOUND";
        setCallState("RINGING");
        setIsOpen(true);
      } else if (isConnected) {
        setCallState("CONNECTED");
        setIsOpen(true);
      } else if (isEnded) {
        endCallSession(rawState.includes("busy") ? "Busy" : undefined);
        setIsOpen(true);
      }
    };

    const handleRegisterEvent = (e: any) => {
      const rawStatus = (e.detail?.status || e.detail?.event || e.detail?.state || "").toString().toLowerCase();
      console.log("📞 Softphone Registration Event Status:", rawStatus, e.detail);

      if (rawStatus === "registered" || rawStatus === "connected" || rawStatus === "ready") {
        setIsRegistered(true);
        setErrorMessage(null);
        setIsInitializing(false);
      } else if (
        rawStatus === "unregistered" ||
        rawStatus === "failed" ||
        rawStatus === "error" ||
        rawStatus === "disconnected" ||
        rawStatus === "terminated" ||
        rawStatus === "registration_failed"
      ) {
        setIsRegistered(false);
        setIsInitializing(false);
        setCallState("IDLE");
        const reason = e.detail?.reason || e.detail?.message || e.detail?.data?.message;
        setErrorMessage(
          reason
            ? `Softphone registration failed: ${reason}`
            : "Softphone registration failed. Please check network or telephony credentials."
        );
      }
    };

    window.addEventListener("exotelCallEvent", handleCallEvent);
    window.addEventListener("exotelRegisterEvent", handleRegisterEvent);

    // Auto-connect once SDK is loaded if access token exists in localStorage
    if (localStorage.getItem("accessToken")) {
      setTimeout(() => {
        connectSoftphone();
      }, 1000);
    }

    return () => {
      window.removeEventListener("exotelCallEvent", handleCallEvent);
      window.removeEventListener("exotelRegisterEvent", handleRegisterEvent);
    };
  }, [connectSoftphone, endCallSession]);

  useEffect(() => {
    let timer: any = null;
    if (callState === "CONNECTED") {
      timer = setInterval(() => setDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [callState]);

  const handleDial = () => {
    if (!dialNumber) return;

    // Normalize destination number for Exotel (0-prefixed domestic format: 09880023311)
    const digits = dialNumber.replace(/\D/g, "");
    let target = dialNumber.trim();
    if (digits.length === 10) {
      target = "0" + digits;
    } else if (digits.length === 12 && digits.startsWith("91")) {
      target = "0" + digits.substring(2);
    } else if (digits.length === 11 && digits.startsWith("0")) {
      target = digits;
    }

    console.log("📞 Softphone Dialing number:", dialNumber, "-> Normalized:", target);
    setCallDirection("OUTBOUND");
    callDirectionRef.current = "OUTBOUND";
    setCallerNumber(target);
    callerNumberRef.current = target;
    setDuration(0);
    setCallSummary(null);
    setCallState("DIALING");
    if (window.exotelDial) {
      const dialSuccess = window.exotelDial(target, "propela_outbound");
      if (dialSuccess === false) {
        setCallState("IDLE");
        setErrorMessage("Failed to initiate call. Make sure softphone is registered and ready.");
      }
    }
  };

  const handleAnswer = () => {
    if (window.exotelAnswer) {
      window.exotelAnswer();
    }
    setCallState("CONNECTED");
  };

  const handleHangup = () => {
    if (window.exotelHangup) {
      window.exotelHangup();
    }
    endCallSession("Completed");
  };

  const handleToggleMute = () => {
    if (window.exotelToggleMute) {
      window.exotelToggleMute();
      setIsMuted(!isMuted);
    }
  };

  const handleToggleHold = () => {
    if (window.exotelToggleHold) {
      window.exotelToggleHold();
      setIsOnHold(!isOnHold);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remSecs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end animate-in fade-in slide-in-from-bottom-4 duration-300">
      {isOpen ? (
        <div className="w-80 bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-muted/60 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-2.5 h-2.5 rounded-full ${isRegistered ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-amber-500 animate-pulse"
                  }`}
              />
              <span className="text-xs font-bold text-foreground">
                {isRegistered ? "Exotel Softphone (Ready)" : "Exotel Softphone"}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <FontAwesomeIcon icon={faChevronDown} className="text-xs" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4">
            {!isRegistered ? (
              <div className="space-y-3 text-center py-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto text-lg">
                  <FontAwesomeIcon icon={faHeadset} />
                </div>
                <div className="text-xs text-muted-foreground">
                  Connect browser softphone to start placing & receiving calls.
                </div>
                {errorMessage && (
                  <div className="p-2.5 text-[11px] text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800 text-left">
                    {errorMessage}
                  </div>
                )}
                <button
                  onClick={connectSoftphone}
                  disabled={isInitializing}
                  className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={isInitializing ? faRotate : faPlug} className={`text-xs ${isInitializing ? "animate-spin" : ""}`} />
                  <span>{isInitializing ? "Fetching Dynamic Token..." : "Connect Softphone"}</span>
                </button>
              </div>
            ) : (
              <>
                {/* 1. Call Ended Summary View */}
                {callState === "ENDED" && callSummary ? (
                  <div className="space-y-4 py-1 animate-in fade-in zoom-in-95 duration-200">
                    <div className="text-center space-y-1">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-base">
                        <FontAwesomeIcon icon={faCheck} />
                      </div>
                      <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Call Summary
                      </div>
                      <div className="text-sm font-bold text-foreground truncate">
                        {callSummary.number}
                      </div>
                    </div>

                    <div className="bg-muted/40 border border-border/60 rounded-2xl p-3.5 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faClock} className="text-[10px] opacity-70" />
                          Duration
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          {formatTime(callSummary.duration)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faPhone} className="text-[10px] opacity-70" />
                          Type
                        </span>
                        <span className="font-semibold text-foreground">
                          {callSummary.direction === "OUTBOUND" ? "Outbound Call" : "Inbound Call"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <FontAwesomeIcon icon={faUser} className="text-[10px] opacity-70" />
                          Agent
                        </span>
                        <span className="font-semibold text-foreground truncate max-w-[140px]" title={agentEmail}>
                          {agentEmail}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${callSummary.status === "Completed"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            }`}
                        >
                          {callSummary.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => {
                          setCallState("IDLE");
                          setCallerNumber("");
                          setDuration(0);
                          setCallSummary(null);
                        }}
                        className="w-full py-2.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl transition-all border border-border cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <FontAwesomeIcon icon={faRotate} className="text-xs" />
                        <span>New Call</span>
                      </button>

                      <button
                        onClick={() => {
                          const num = callSummary.number;
                          setCallState("IDLE");
                          setCallSummary(null);
                          setDialNumber(num);
                          setTimeout(() => {
                            handleDial();
                          }, 100);
                        }}
                        className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <FontAwesomeIcon icon={faPhone} className="text-xs" />
                        <span>Redial</span>
                      </button>
                    </div>
                  </div>
                ) : callState !== "IDLE" ? (
                  /* 2. Active Call UI */
                  <div className="space-y-4 text-center py-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {callState === "DIALING" && "Dialing..."}
                        {callState === "RINGING" && "Incoming Call"}
                        {callState === "CONNECTED" && "Connected"}
                      </span>
                      <div className="text-base font-bold text-foreground truncate">
                        {callerNumber || "Unknown Caller"}
                      </div>
                      {callState === "CONNECTED" && (
                        <div className="text-xs font-mono text-muted-foreground">
                          {formatTime(duration)}
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-3 pt-2">
                      {callState === "RINGING" ? (
                        <>
                          <button
                            onClick={handleAnswer}
                            className="w-12 h-12 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 transition-transform active:scale-95 cursor-pointer"
                          >
                            <FontAwesomeIcon icon={faPhoneVolume} className="text-base" />
                          </button>
                          <button
                            onClick={handleHangup}
                            className="w-12 h-12 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 transition-transform active:scale-95 cursor-pointer"
                          >
                            <FontAwesomeIcon icon={faPhoneSlash} className="text-base" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleToggleMute}
                            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${isMuted ? "bg-amber-500 text-white border-amber-500" : "bg-muted text-foreground border-border hover:bg-muted/80"
                              }`}
                          >
                            <FontAwesomeIcon icon={isMuted ? faMicrophoneSlash : faMicrophone} className="text-xs" />
                          </button>
                          <button
                            onClick={handleToggleHold}
                            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors cursor-pointer ${isOnHold ? "bg-amber-500 text-white border-amber-500" : "bg-muted text-foreground border-border hover:bg-muted/80"
                              }`}
                          >
                            <FontAwesomeIcon icon={isOnHold ? faPlay : faPause} className="text-xs" />
                          </button>
                          <button
                            onClick={handleHangup}
                            className="w-11 h-11 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 transition-transform active:scale-95 cursor-pointer"
                          >
                            <FontAwesomeIcon icon={faPhoneSlash} className="text-sm" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  /* 3. Dialpad UI */
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-muted-foreground">Dial Number</label>
                      <input
                        type="tel"
                        value={dialNumber}
                        onChange={(e) => setDialNumber(e.target.value)}
                        placeholder="Enter phone number..."
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <button
                      onClick={handleDial}
                      disabled={!dialNumber}
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <FontAwesomeIcon icon={faPhone} className="text-xs" />
                      <span>Call Now</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* Floating Button when Collapsed */
        <button
          onClick={() => setIsOpen(true)}
          className={`px-4 py-3 rounded-full flex items-center gap-2.5 shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer ${isRegistered
            ? "bg-primary text-primary-foreground"
            : "bg-card border border-border text-foreground shadow-lg"
            }`}
        >
          <div
            className={`w-2.5 h-2.5 rounded-full ${isRegistered ? "bg-emerald-400 animate-pulse" : "bg-amber-500"
              }`}
          />
          <FontAwesomeIcon icon={faPhone} className="text-xs" />
          <span className="text-xs font-bold">
            {callState === "CONNECTED"
              ? `In Call (${formatTime(duration)})`
              : callState === "ENDED"
                ? "Call Ended"
                : isRegistered
                  ? "Softphone (Ready)"
                  : "Softphone"}
          </span>
          <FontAwesomeIcon icon={faChevronUp} className="text-xs opacity-60" />
        </button>
      )}
    </div>
  );
}
