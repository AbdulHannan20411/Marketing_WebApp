import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { spotlight, staggerDelay } from "@/components/motion/effects";
import { PointerEffects } from "@/components/motion/pointer-effects";
import { Reveal } from "@/components/motion/reveal";

describe("stagger", () => {
  it("steps by 40ms and caps at 280ms so long lists never wait", () => {
    expect([0, 1, 2, 7, 8, 30].map(staggerDelay)).toEqual([0, 40, 80, 280, 280, 280]);
  });

  it("Reveal turns a list index into its reveal delay", () => {
    const { container } = render(
      <>
        <Reveal index={0}>a</Reveal>
        <Reveal index={3}>b</Reveal>
        <Reveal index={12}>c</Reveal>
      </>,
    );
    const delays = [...container.querySelectorAll<HTMLElement>("[data-reveal]")].map((el) =>
      el.style.getPropertyValue("--reveal-delay"),
    );
    expect(delays).toEqual(["", "120ms", "280ms"]);
  });
});

describe("spotlight", () => {
  it("lifts by default, 1px when small, and can be just the glow", () => {
    expect(spotlight()).toBe("spotlight lift");
    expect(spotlight({ small: true })).toBe("spotlight lift lift-sm");
    expect(spotlight({ lift: false })).toBe("spotlight");
  });
});

describe("PointerEffects", () => {
  let matches = true;

  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
    // Run each frame straight away; id 0 means "nothing pending" to the listener.
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });
    vi.stubGlobal("cancelAnimationFrame", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    matches = true;
  });

  function setup() {
    const { container, unmount } = render(
      <>
        <ul className="divide-y">
          <li>row</li>
        </ul>
        <div data-no-hover="">
          <a href="#x" data-hover-glow="">
            opted out
          </a>
        </div>
        <button type="button" data-magnetic="">
          cta
        </button>
        <PointerEffects />
      </>,
    );
    const row = container.querySelector("li")!;
    const optedOut = container.querySelector("a")!;
    const button = container.querySelector("button")!;
    for (const el of [row, optedOut, button]) {
      el.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 40 }) as DOMRect;
    }
    return { row, optedOut, button, unmount };
  }

  function pointAt(target: Element | null, x = 150, y = 30, pointerType = "mouse") {
    document.elementFromPoint = () => target;
    const event = new MouseEvent("pointermove", { clientX: x, clientY: y, bubbles: true });
    Object.defineProperty(event, "pointerType", { value: pointerType });
    document.dispatchEvent(event);
  }

  it("sets the glow and its position on the row under the pointer, and clears it on leave", () => {
    const { row } = setup();
    pointAt(row);
    expect(row).toHaveAttribute("data-glow");
    expect(row.style.getPropertyValue("--glow-x")).toBe("150px");
    expect(row.style.getPropertyValue("--glow-y")).toBe("30px");

    pointAt(document.body);
    expect(row).not.toHaveAttribute("data-glow");
  });

  it("respects data-no-hover", () => {
    const { optedOut } = setup();
    pointAt(optedOut);
    expect(optedOut).not.toHaveAttribute("data-glow");
  });

  it("pulls a magnetic button at most 8px across and 0.6× that down", () => {
    const { button } = setup();
    pointAt(button, 200, 40);
    expect(button.style.getPropertyValue("--mag-x")).toBe("8.00px");
    expect(button.style.getPropertyValue("--mag-y")).toBe("4.80px");
  });

  it("ignores touch", () => {
    const { row } = setup();
    pointAt(row, 150, 30, "touch");
    expect(row).not.toHaveAttribute("data-glow");
  });

  it("does nothing for coarse pointers or reduced motion", () => {
    matches = false;
    const { row } = setup();
    pointAt(row);
    expect(row).not.toHaveAttribute("data-glow");
  });
});
