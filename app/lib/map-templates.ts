import exampleTemplate from "../../examples/example.json";

export type MapTemplateId = "theater";

export type MapTemplateMeta = {
  id: MapTemplateId;
  title: string;
  description: string;
};

const TEMPLATE_DATA: Record<MapTemplateId, unknown> = {
  theater: exampleTemplate,
};

export const MAP_TEMPLATES: MapTemplateMeta[] = [
  {
    id: "theater",
    title: "Teatro",
    description: "Platea, sectores laterales y estructura escenica.",
  },
];

export const DEFAULT_TEMPLATE_ID: MapTemplateId = "theater";

export const getTemplatePayloadById = (id: MapTemplateId): string =>
  JSON.stringify(TEMPLATE_DATA[id], null, 2);

export const getDefaultTemplatePayload = (): string =>
  getTemplatePayloadById(DEFAULT_TEMPLATE_ID);
