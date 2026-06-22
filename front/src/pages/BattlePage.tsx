import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Header } from "../components/Header";

interface BattleMovie {
  movieNm: string;
  openDt: string;
  audiAcc: number;
  salesAcc: number;
  scrnCnt: number;
}

const CATEGORIES = [
  {
    key: "audiAcc" as const,
    label: "누적 관객수",
    question: "어느 영화를 더 많은 사람이 봤을까요?",
    format: (v: number) => `${v.toLocaleString()}명`,
  },
  {
    key: "salesAcc" as const,
    label: "누적 매출",
    question: "어느 영화의 누적 매출이 더 높을까요?",
    format: (v: number) => `${(v / 100_000_000).toFixed(1)}억원`,
  },
  {
    key: "scrnCnt" as const,
    label: "최다 스크린 수",
    question: "어느 영화가 더 많은 스크린에서 상영됐을까요?",
    format: (v: number) => `${v.toLocaleString()}개`,
  },
];

function pickTwo<T>(arr: T[]): [T, T] {
  const i = Math.floor(Math.random() * arr.length);
  let j = Math.floor(Math.random() * (arr.length - 1));
  if (j >= i) j++;
  return [arr[i], arr[j]];
}

export function BattlePage() {
  const [pool, setPool] = useState<BattleMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [left, setLeft] = useState<BattleMovie | null>(null);
  const [right, setRight] = useState<BattleMovie | null>(null);
  const [category, setCategory] = useState(CATEGORIES[0]);

  const [picked, setPicked] = useState<"left" | "right" | null>(null);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [resultMsg, setResultMsg] = useState("");
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [flashKey, setFlashKey] = useState(0);

  const nextRound = useCallback((currentPool: BattleMovie[]) => {
    const [a, b] = pickTwo(currentPool);
    const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    setLeft(a);
    setRight(b);
    setCategory(cat);
    setPicked(null);
    setResultMsg("");
  }, []);

  useEffect(() => {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/battle/pool`);
        const data: BattleMovie[] = await res.json();
        if (cancelled) return;
        setPool(data);
        setLoading(false);
        if (data.length >= 2) nextRound(data);
      } catch {
        if (!cancelled) {
          setError("데이터를 불러오지 못했습니다");
          setLoading(false);
        }
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [nextRound]);

  const pick = (side: "left" | "right") => {
    if (picked || !left || !right) return;
    setPicked(side);

    const leftVal = left[category.key];
    const rightVal = right[category.key];
    const correctSide = leftVal >= rightVal ? "left" : "right";
    const isCorrect = side === correctSide;

    if (isCorrect) {
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBest((b) => Math.max(b, newStreak));
      setResultMsg("정답!");
    } else {
      setStreak(0);
      setResultMsg("틀렸습니다");
    }

    setFlash(isCorrect ? "correct" : "wrong");
    setFlashKey((k) => k + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center text-gray-500 dark:text-gray-400 animate-pulse">
        데이터 불러오는 중...
      </div>
    );
  }

  if (error || pool.length < 2) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white">
        <Header />
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] gap-4">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {error ??
              "KOFIC 데이터가 부족합니다. 대시보드에서 박스오피스를 먼저 조회해주세요."}
          </p>
        </div>
      </div>
    );
  }

  if (!left || !right) return null;

  const leftVal = left[category.key];
  const rightVal = right[category.key];
  const winnerSide = leftVal >= rightVal ? "left" : "right";

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white">
      {/* 화면 플래시 오버레이 */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key={flashKey}
            className={`pointer-events-none fixed inset-0 z-50 ${
              flash === "correct" ? "bg-green-400/20" : "bg-red-400/20"
            }`}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.55 }}
            onAnimationComplete={() => setFlash(null)}
          />
        )}
      </AnimatePresence>

      <Header />

      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* 상단 스코어 */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-sm text-gray-500 dark:text-gray-300">
            최고 연속 정답:{" "}
            <span className="text-green-500 dark:text-green-400 font-bold">
              {best}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500 dark:text-gray-300">연속 정답</span>
            <motion.span
              key={streak}
              initial={{
                scale: 1.6,
                color: streak === 0 ? "#ef4444" : "#22c55e",
              }}
              animate={{ scale: 1, color: "inherit" }}
              transition={{ duration: 0.35, type: "spring", stiffness: 300 }}
              className="text-2xl font-extrabold text-gray-900 dark:text-white tabular-nums inline-block"
            >
              {streak}
            </motion.span>
          </div>
        </div>

        {/* 질문 */}
        <motion.p
          key={category.key}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-lg font-semibold text-gray-700 dark:text-gray-200 mb-8"
        >
          {category.question}
        </motion.p>

        {/* 배틀 카드 */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
          <BattleCard
            movie={left}
            side="left"
            category={category}
            picked={picked}
            winnerSide={winnerSide}
            onPick={() => pick("left")}
          />

          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl font-black text-gray-300 dark:text-gray-600">
              VS
            </span>
          </div>

          <BattleCard
            movie={right}
            side="right"
            category={category}
            picked={picked}
            winnerSide={winnerSide}
            onPick={() => pick("right")}
          />
        </div>

        {/* 결과 + 다음 버튼 */}
        <AnimatePresence>
          {picked && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 mt-10"
            >
              <p
                className={`text-2xl font-extrabold ${
                  resultMsg === "정답!"
                    ? "text-green-500 dark:text-green-400"
                    : "text-red-500 dark:text-red-400"
                }`}
              >
                {resultMsg}
              </p>
              <button
                onClick={() => nextRound(pool)}
                className="px-8 py-3 rounded-2xl bg-green-500 hover:bg-green-400 text-white font-bold transition-colors"
              >
                다음 배틀 →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface CardProps {
  movie: BattleMovie;
  side: "left" | "right";
  category: (typeof CATEGORIES)[number];
  picked: "left" | "right" | null;
  winnerSide: "left" | "right";
  onPick: () => void;
}

function BattleCard({
  movie,
  side,
  category,
  picked,
  winnerSide,
  onPick,
}: CardProps) {
  const isRevealed = picked !== null;
  const isWinner = isRevealed && winnerSide === side;

  return (
    <motion.button
      onClick={onPick}
      disabled={picked !== null}
      whileHover={!picked ? { scale: 1.03 } : {}}
      whileTap={!picked ? { scale: 0.97 } : {}}
      animate={
        isRevealed && !isWinner
          ? { x: [0, -10, 10, -8, 8, -4, 4, 0] }
          : isRevealed && isWinner
            ? { y: [0, -12, 3, 0] }
            : {}
      }
      transition={{ duration: isRevealed && !isWinner ? 0.5 : 0.4 }}
      className={`w-full rounded-3xl border-2 p-6 text-left transition-all duration-300 ${
        !picked
          ? "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:border-green-500 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          : isWinner
            ? "border-green-500 bg-green-500/10"
            : "border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 opacity-50"
      }`}
    >
      {/* 영화명 */}
      <p className="text-base font-bold text-gray-900 dark:text-white leading-snug mb-1 line-clamp-2">
        {movie.movieNm}
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-300 mb-5">
        개봉 {movie.openDt || "미정"}
      </p>

      {/* 스탯 */}
      <div className="flex flex-col items-center py-4">
        <p className="text-xs text-gray-500 dark:text-gray-300 uppercase tracking-widest mb-2">
          {category.label}
        </p>
        <AnimatePresence mode="wait">
          {isRevealed ? (
            <motion.p
              key="revealed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`text-3xl font-extrabold tabular-nums ${
                isWinner
                  ? "text-green-500 dark:text-green-400"
                  : "text-gray-400 dark:text-gray-500"
              }`}
            >
              {category.format(movie[category.key])}
            </motion.p>
          ) : (
            <motion.p
              key="hidden"
              className="text-4xl font-extrabold text-gray-200 dark:text-gray-600 tracking-widest"
            >
              ?
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {isWinner && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 15 }}
          className="mt-2 text-center text-sm font-bold text-green-500 dark:text-green-400"
        >
          ▲ 승리
        </motion.div>
      )}
    </motion.button>
  );
}
