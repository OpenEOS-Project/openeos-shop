'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, Check } from '@untitledui/icons';

import type {
  ProductOptionGroup,
  SelectedOption,
  ShopProduct,
} from '@/lib/api';
import { formatPrice } from '@/lib/format';

interface ProductOptionsSheetProps {
  product: ShopProduct;
  currency: string;
  onClose: () => void;
  onConfirm: (options: SelectedOption[]) => void;
}

function buildDefaults(groups: ProductOptionGroup[]): SelectedOption[] {
  const defaults: SelectedOption[] = [];
  for (const group of groups) {
    if (group.type === 'ingredients') {
      for (const opt of group.options) {
        defaults.push({
          group: group.name,
          option: opt.name,
          priceModifier: opt.priceModifier,
        });
      }
    } else if (group.type === 'single') {
      const initial = group.options.find((o) => o.default);
      if (initial) {
        defaults.push({
          group: group.name,
          option: initial.name,
          priceModifier: initial.priceModifier,
        });
      }
    } else if (group.type === 'multiple') {
      for (const opt of group.options) {
        if (opt.default) {
          defaults.push({
            group: group.name,
            option: opt.name,
            priceModifier: opt.priceModifier,
          });
        }
      }
    }
  }
  return defaults;
}

function getGroupHint(type: ProductOptionGroup['type']): string {
  switch (type) {
    case 'single':
      return 'Eine Option wählen';
    case 'multiple':
      return 'Mehrere möglich';
    case 'ingredients':
      return 'Abwählen, was du nicht möchtest';
  }
}

export function ProductOptionsSheet({
  product,
  currency,
  onClose,
  onConfirm,
}: ProductOptionsSheetProps) {
  const groups = useMemo(() => product.options?.groups ?? [], [product]);
  const [selected, setSelected] = useState<SelectedOption[]>(() => buildDefaults(groups));
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    setSelected(buildDefaults(groups));
  }, [groups, product.id]);

  const isOptionSelected = (groupName: string, optionName: string) => {
    const o = selected.find((s) => s.group === groupName && s.option === optionName);
    return o ? !o.excluded : false;
  };

  const isOptionExcluded = (groupName: string, optionName: string) => {
    const o = selected.find((s) => s.group === groupName && s.option === optionName);
    return o?.excluded === true;
  };

  const toggleOption = (group: ProductOptionGroup, optionName: string, priceModifier: number) => {
    if (group.type === 'ingredients') {
      setSelected((prev) => {
        const existing = prev.find((s) => s.group === group.name && s.option === optionName);
        if (existing) {
          return prev.map((s) =>
            s.group === group.name && s.option === optionName ? { ...s, excluded: !s.excluded } : s,
          );
        }
        return [...prev, { group: group.name, option: optionName, priceModifier }];
      });
      return;
    }

    if (group.type === 'multiple') {
      setSelected((prev) => {
        const idx = prev.findIndex((s) => s.group === group.name && s.option === optionName);
        if (idx >= 0) return prev.filter((_, i) => i !== idx);
        return [...prev, { group: group.name, option: optionName, priceModifier }];
      });
      return;
    }

    // single
    setSelected((prev) => [
      ...prev.filter((s) => s.group !== group.name),
      { group: group.name, option: optionName, priceModifier },
    ]);
  };

  // Only positive modifiers count — must match lineUnitPrice in the cart
  // store and the server-side recompute (INVALID_TOTAL otherwise).
  const totalExtras = selected
    .filter((s) => !s.excluded && s.priceModifier > 0)
    .reduce((acc, s) => acc + s.priceModifier, 0);
  const totalPrice = Number(product.price) + totalExtras;

  const requirementsMet = groups
    .filter((g) => g.required)
    .every((g) => selected.some((s) => s.group === g.name && !s.excluded));

  const close = () => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, 200);
  };

  const handleConfirm = () => {
    if (!requirementsMet) return;
    const finalOptions = selected.filter((s) => {
      if (s.excluded) return true;
      const group = groups.find((g) => g.name === s.group);
      if (group?.type === 'ingredients') return false;
      return true;
    });
    onConfirm(finalOptions);
    close();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{ position: 'fixed', inset: 0, zIndex: 60 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        onClick={close}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(20,18,12,.55)',
          opacity: closing ? 0 : 1,
          transition: 'opacity .2s ease',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '85%',
          background: 'var(--paper)',
          borderTopLeftRadius: 'var(--r-lg)',
          borderTopRightRadius: 'var(--r-lg)',
          boxShadow: 'var(--sh-3)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transform: closing ? 'translateY(100%)' : undefined,
          transition: 'transform .2s ease',
          animation: closing ? undefined : 'shop-sheet-up .22s ease',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8, flexShrink: 0 }}>
          <div style={{ width: 44, height: 4, background: 'color-mix(in oklab, var(--ink) 18%, transparent)', borderRadius: 999 }} />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 18px 14px',
            borderBottom: '1px solid color-mix(in oklab, var(--ink) 8%, transparent)',
            flexShrink: 0,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <h2
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--ink)',
                letterSpacing: '-0.01em',
                margin: 0,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {product.name}
            </h2>
            <p className="mono" style={{ fontSize: 13, color: 'var(--mute)', marginTop: 2 }}>
              {formatPrice(Number(product.price), currency)}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Schließen"
            style={{
              padding: 8,
              borderRadius: 'var(--r-sm)',
              background: 'transparent',
              border: 'none',
              color: 'var(--ink-2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', minHeight: 0 }}>
          {groups.map((group) => (
            <div key={group.name} style={{ marginBottom: 22 }}>
              <h3
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  margin: '0 0 2px',
                  letterSpacing: '0.01em',
                }}
              >
                {group.name}
                {group.required && <span style={{ marginLeft: 4, color: 'var(--red)' }}>*</span>}
              </h3>
              <p style={{ fontSize: 11, color: 'var(--mute)', margin: '0 0 10px' }}>
                {getGroupHint(group.type)}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {group.options.map((option) => {
                  const sel = isOptionSelected(group.name, option.name);
                  const exc = isOptionExcluded(group.name, option.name);
                  if (group.type === 'ingredients') {
                    const accent = exc ? 'var(--red)' : 'var(--green-ink)';
                    return (
                      <button
                        key={option.name}
                        type="button"
                        onClick={() => toggleOption(group, option.name, option.priceModifier)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '11px 14px',
                          background: 'var(--paper-2)',
                          border: `1px solid ${accent}`,
                          borderRadius: 'var(--r-sm)',
                          cursor: 'pointer',
                          width: '100%',
                          textAlign: 'left',
                          opacity: exc ? 0.7 : 1,
                          transition: 'border-color .12s, opacity .12s',
                        }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: 6,
                              background: accent,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              color: '#fff',
                            }}
                          >
                            {exc ? (
                              <X style={{ width: 12, height: 12 }} />
                            ) : (
                              <Check style={{ width: 12, height: 12 }} />
                            )}
                          </span>
                          <span
                            style={{
                              fontSize: 14,
                              fontWeight: 500,
                              color: exc ? 'var(--mute)' : 'var(--ink)',
                              textDecoration: exc ? 'line-through' : 'none',
                            }}
                          >
                            {option.name}
                          </span>
                        </span>
                        {option.priceModifier > 0 && !exc && (
                          <span className="mono" style={{ fontSize: 13, color: 'var(--mute)' }}>
                            +{formatPrice(option.priceModifier, currency)}
                          </span>
                        )}
                      </button>
                    );
                  }

                  const isMultiple = group.type === 'multiple';
                  return (
                    <button
                      key={option.name}
                      type="button"
                      onClick={() => toggleOption(group, option.name, option.priceModifier)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '11px 14px',
                        background: sel ? 'color-mix(in oklab, var(--green-soft) 60%, var(--paper))' : 'var(--paper-2)',
                        border: `1px solid ${sel ? 'var(--green-ink)' : 'color-mix(in oklab, var(--ink) 12%, transparent)'}`,
                        borderRadius: 'var(--r-sm)',
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                        transition: 'background .12s, border-color .12s',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: isMultiple ? 6 : 999,
                            border: `2px solid ${sel ? 'var(--green-ink)' : 'color-mix(in oklab, var(--ink) 18%, transparent)'}`,
                            background: sel ? 'var(--green-ink)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {sel && <Check style={{ width: 12, height: 12, color: 'var(--paper)' }} />}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                          {option.name}
                        </span>
                      </span>
                      {option.priceModifier > 0 && (
                        <span className="mono" style={{ fontSize: 13, color: 'var(--mute)' }}>
                          +{formatPrice(option.priceModifier, currency)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '14px 18px calc(14px + env(safe-area-inset-bottom, 0px))',
            borderTop: '1px solid color-mix(in oklab, var(--ink) 8%, transparent)',
            background: 'var(--paper-2)',
            flexShrink: 0,
          }}
        >
          <div>
            <p style={{ fontSize: 11, color: 'var(--mute)', margin: 0 }}>Gesamt</p>
            <p
              className="mono"
              style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: 0 }}
            >
              {formatPrice(totalPrice, currency)}
            </p>
          </div>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!requirementsMet}
            className="btn btn--primary"
            style={{ padding: '12px 20px', fontSize: 14 }}
          >
            Hinzufügen
          </button>
        </div>
      </div>
      <style>{`
        @keyframes shop-sheet-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
