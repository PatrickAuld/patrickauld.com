interface ConfigurationOption {
    id: string;
    childSettingIds: string[];
    complicationSlotIds: number[];
}
interface UserSetting {
    id: string;
    value: string | number | boolean;
    active: boolean;
    options: ConfigurationOption[];
}

type ComplicationType = "SHORT_TEXT" | "LONG_TEXT" | "MONOCHROMATIC_IMAGE" | "SMALL_IMAGE" | "PHOTO_IMAGE" | "RANGED_VALUE" | "GOAL_PROGRESS" | "WEIGHTED_ELEMENTS" | "EMPTY";
interface ComplicationData {
    type: ComplicationType;
    data?: Record<string, string | number | boolean>;
}

interface RenderOptions {
    xml: string;
    assets?: Map<string, ArrayBuffer>;
    width?: number;
    height?: number;
    time?: Date;
    ambient?: boolean;
    configuration?: Record<string, string | number | boolean>;
    flavor?: string;
    complications?: Record<number, ComplicationData>;
    animate?: boolean;
    elapsedMs?: number;
    /** Preview device ambient transition window; Variant duration/startOffset are fractions of it. */
    ambientTransitionDurationMs?: number;
    dataSources?: Record<string, string | number | boolean> | ((time: Date) => Record<string, string | number | boolean>);
    locale?: string;
    timeZone?: string;
    calendar?: string;
    currency?: string;
    is24Hour?: boolean;
    strings?: Record<string, string>;
    photos?: Record<string, string[]>;
    visible?: boolean;
    random?: () => number;
    onLaunch?: (target: string) => void;
    onError?: (error: unknown) => void;
}
interface AccessibilityItem {
    name: string;
    text: string;
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    launchTarget?: string;
}
interface RenderResult {
    metadata: Map<string, string>;
    accessibility: AccessibilityItem[];
    settings: UserSetting[];
    activeComplicationSlotIds: number[];
    update: (changes: Partial<RenderOptions>) => Promise<void>;
    tap: (x: number, y: number) => Promise<void>;
    stop: () => void;
}
declare function renderWatchFace(canvas: HTMLCanvasElement, initial: RenderOptions): Promise<RenderResult>;

export { type AccessibilityItem, type ComplicationData, type ComplicationType, type ConfigurationOption, type RenderOptions, type RenderResult, type UserSetting, renderWatchFace };
