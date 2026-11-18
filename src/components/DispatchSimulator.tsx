import React, { useState, useEffect } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  Navigation,
  ShieldCheck,
  AlertCircle,
  X,
  Play,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { TransferRecommendation } from '../utils/coordination.ts';

interface DispatchSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  recommendation: TransferRecommendation | null;
  onDispatchConfirmed: (recId: string) => void;
}

export default function DispatchSimulatorModal({
  isOpen,
  onClose,
  recommendation,
  onDispatchConfirmed,
}: DispatchSimulatorModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsSimulating(false);
    }
  }, [isOpen]);

  if (!isOpen || !recommendation) return null;

  const steps = [
    {
      title: 'Safety Invariant Verification',
      desc: 'Verify donor retains ≥ required baseline reserves',
      status: currentStep > 0 ? 'completed' : currentStep === 0 ? 'current' : 'pending',
      detail: `Donor ${recommendation.sourceLocation} retains ${recommendation.evidence.postTransferSourceAvailable} units (≥ required baseline).`,
    },
    {
      title: 'Vehicle & Route Assignment',
      desc: 'Assign nearest emergency transport unit & calculate corridor',
      status: currentStep > 1 ? 'completed' : currentStep === 1 ? 'current' : 'pending',
      detail: `Assigned: Rapid Response Transport Unit Alpha via Corridor 4.`,
    },
    {
      title: 'Transit & Telemetry Handshake',
      desc: 'GPS position telemetry and en-route tracking',
      status: currentStep > 2 ? 'completed' : currentStep === 2 ? 'current' : 'pending',
      detail: `Estimated Transit: 14 mins. Priority traffic clearance active.`,
    },
    {
      title: 'Delivery & Inventory Ledger Rebalance',
      desc: 'Arrival at destination and multi-facility ledger update',
      status: currentStep > 3 ? 'completed' : currentStep === 3 ? 'current' : 'pending',
      detail: `${recommendation.recommendedUnits} ${recommendation.unit} absorbed into ${recommendation.targetLocation}. Deficit cleared.`,
    },
  ];

  const handleStartSimulation = () => {
    setIsSimulating(true);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCurrentStep(step);
      if (step >= 4) {
        clearInterval(interval);
        setIsSimulating(false);
        onDispatchConfirmed(recommendation.id);
      }
    }, 1100);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl rounded-2xl border border-teal-700/60 bg-gradient-to-b from-[#09221F] via-[#0C2B27] to-[#071615] p-6 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-teal-900/60 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-teal-950 border border-teal-700 text-amber-400">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-heading">
                  Authorize & Simulate Rapid Dispatch
                </h3>
                <p className="text-xs text-slate-300">
                  {recommendation.id} • {recommendation.resourceName}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-teal-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Transfer Summary Pill */}
          <div className="my-4 p-3.5 rounded-xl bg-[#061413] border border-teal-900/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">DONOR HUB:</span>
              <span className="text-emerald-400 font-bold">{recommendation.sourceLocation}</span>
            </div>
            <div className="text-center px-3.5 py-1.5 rounded-full bg-teal-600 text-white font-bold shadow-sm">
              ➔ {recommendation.recommendedUnits} {recommendation.unit} ➔
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[11px]">RECIPIENT SITE:</span>
              <span className="text-rose-400 font-bold">{recommendation.targetLocation}</span>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="space-y-4 my-5">
            {steps.map((st, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="pt-0.5">
                  {st.status === 'completed' ? (
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                      <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    </div>
                  ) : st.status === 'current' ? (
                    <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-slate-900 font-bold animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-slate-900" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#08221E] border border-teal-800 flex items-center justify-center text-slate-400 text-xs">
                      {idx + 1}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-xs font-bold ${
                        st.status === 'completed'
                          ? 'text-emerald-300'
                          : st.status === 'current'
                            ? 'text-amber-300'
                            : 'text-slate-400'
                      }`}
                    >
                      {st.title}
                    </h4>
                    {st.status === 'current' && isSimulating && (
                      <span className="text-[10px] text-amber-400 font-bold animate-pulse">
                        PROCESSING...
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{st.desc}</p>
                  {(st.status === 'current' || st.status === 'completed') && (
                    <p className="text-xs text-slate-200 mt-1.5 bg-[#061413] p-2 rounded-lg border border-teal-900/60">
                      {st.detail}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-teal-900/60 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSimulating}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleStartSimulation}
                disabled={isSimulating}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-lg shadow-teal-950/50 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isSimulating ? 'Executing Transit...' : 'Confirm & Simulate Route'}</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Complete & Close</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
