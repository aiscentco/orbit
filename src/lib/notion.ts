import { Client as NotionClient } from "@notionhq/client";
import type {
  PageObjectResponse,
  PartialPageObjectResponse,
  PartialDataSourceObjectResponse,
  DataSourceObjectResponse,
} from "@notionhq/client";

// Single place all Notion API access lives. If Orbit ever swaps Notion for a
// real database, only this file (and its callers' data, not their code) changes.

const notion = new NotionClient({ auth: process.env.NOTION_TOKEN });

const DATA_SOURCES = {
  clients: "b68b1b7a-30be-4e87-8479-7c0bfae9adcd",
  products: "d9289c44-a176-424b-ba97-2414c0f32fed",
  actions: "6c6cad9d-9aa2-4be8-9722-72d8d0443126",
} as const;

export const GATE_STAGES = [
  "Pre-G1",
  "G1",
  "Post-G1",
  "G2",
  "Post-G2",
  "G3",
  "G4",
  "G5",
] as const;

export type GateStage = (typeof GATE_STAGES)[number];

export type Client = {
  id: string;
  name: string;
  engagementStart: string | null;
  consultingLead: string | null;
  status: string | null;
  labels: {
    campaign: string | null;
    demand: string | null;
    revenueKpi: string | null;
    marginKpi: string | null;
    planningSystem: string | null;
    bmRole: string | null;
  };
  brandPrimaryColor: string | null;
  brandAccentColor: string | null;
  halalRequired: boolean;
  chinaComplianceRequired: boolean;
  notes: string | null;
};

export type Product = {
  id: string;
  name: string;
  clientId: string | null;
  productCode: string | null;
  campaign: string | null;
  gateStage: GateStage | null;
  stageEntered: string | null;
  gateDecision: string | null;
  nextGateDate: string | null;
  launchType: string | null;
  productLife: string | null;
  brandManager: string | null;
  formulationLead: string | null;
  procurementLead: string | null;
  regulatoryLead: string | null;
  intendedSupplier: string | null;
  awardedSupplier: string | null;
  annualDemand: string | null;
  moq: number | null;
  revenueTarget: number | null;
  marginTargetPct: number | null;
  shadeCount: number | null;
  halalCompliant: string | null;
  briefLink: string | null;
  projectStatus: string | null;
};

export type ActionStatus = "To do" | "Waiting" | "Done";
export type ActionSource = "Manual" | "AI-extracted" | "Skill trigger" | "History";

export type Action = {
  id: string;
  note: string;
  productId: string | null;
  status: ActionStatus | null;
  owner: string | null;
  dateLogged: string | null;
  source: ActionSource | null;
};

// --- Notion property readers -------------------------------------------

type NotionProperties = PageObjectResponse["properties"];

function isFullPage(
  page:
    | PageObjectResponse
    | PartialPageObjectResponse
    | PartialDataSourceObjectResponse
    | DataSourceObjectResponse
): page is PageObjectResponse {
  return page.object === "page" && "properties" in page;
}

function title(props: NotionProperties, key: string): string {
  const prop = props[key];
  if (prop?.type !== "title") return "";
  return prop.title.map((t) => t.plain_text).join("");
}

function text(props: NotionProperties, key: string): string | null {
  const prop = props[key];
  if (prop?.type !== "rich_text") return null;
  const value = prop.rich_text.map((t) => t.plain_text).join("");
  return value || null;
}

function select(props: NotionProperties, key: string): string | null {
  const prop = props[key];
  if (prop?.type !== "select") return null;
  return prop.select?.name ?? null;
}

function dateStart(props: NotionProperties, key: string): string | null {
  const prop = props[key];
  if (prop?.type !== "date") return null;
  return prop.date?.start ?? null;
}

function num(props: NotionProperties, key: string): number | null {
  const prop = props[key];
  if (prop?.type !== "number") return null;
  return prop.number;
}

function checkbox(props: NotionProperties, key: string): boolean {
  const prop = props[key];
  if (prop?.type !== "checkbox") return false;
  return prop.checkbox;
}

function url(props: NotionProperties, key: string): string | null {
  const prop = props[key];
  if (prop?.type !== "url") return null;
  return prop.url;
}

function relationId(props: NotionProperties, key: string): string | null {
  const prop = props[key];
  if (prop?.type !== "relation") return null;
  return prop.relation[0]?.id ?? null;
}

// --- Notion property writers -------------------------------------------

const titleProp = (value: string) => ({ title: [{ text: { content: value } }] });
const textProp = (value: string) => ({ rich_text: [{ text: { content: value } }] });
const selectProp = (value: string) => (value ? { select: { name: value } } : { select: null });
const dateProp = (value: string) => (value ? { date: { start: value } } : { date: null });
const numberProp = (value: number) => ({ number: value });
const relationProp = (id: string) => ({ relation: [{ id }] });

// --- Mappers -------------------------------------------------------------

function mapClient(page: PageObjectResponse): Client {
  const p = page.properties;
  return {
    id: page.id,
    name: title(p, "Client name"),
    engagementStart: dateStart(p, "Engagement start"),
    consultingLead: select(p, "Consulting lead"),
    status: select(p, "Status"),
    labels: {
      campaign: text(p, "Label: campaign"),
      demand: text(p, "Label: demand"),
      revenueKpi: text(p, "Label: revenue KPI"),
      marginKpi: text(p, "Label: margin KPI"),
      planningSystem: text(p, "Label: planning system"),
      bmRole: text(p, "Label: BM role"),
    },
    brandPrimaryColor: text(p, "Brand primary color"),
    brandAccentColor: text(p, "Brand accent color"),
    halalRequired: checkbox(p, "HALAL required"),
    chinaComplianceRequired: checkbox(p, "China compliance required"),
    notes: text(p, "Notes"),
  };
}

function mapProduct(page: PageObjectResponse): Product {
  const p = page.properties;
  const stage = select(p, "Gate stage");
  return {
    id: page.id,
    name: title(p, "Product name"),
    clientId: relationId(p, "Client"),
    productCode: text(p, "Product code"),
    campaign: text(p, "Campaign"),
    gateStage: (GATE_STAGES as readonly string[]).includes(stage ?? "")
      ? (stage as GateStage)
      : null,
    stageEntered: dateStart(p, "Stage entered"),
    gateDecision: select(p, "Gate decision"),
    nextGateDate: dateStart(p, "Next gate date"),
    launchType: select(p, "Launch type"),
    productLife: select(p, "Product life"),
    brandManager: text(p, "Brand manager"),
    formulationLead: text(p, "Formulation lead"),
    procurementLead: text(p, "Procurement lead"),
    regulatoryLead: text(p, "Regulatory lead"),
    intendedSupplier: text(p, "Intended supplier"),
    awardedSupplier: text(p, "Awarded supplier"),
    annualDemand: text(p, "Annual demand"),
    moq: num(p, "MOQ"),
    revenueTarget: num(p, "Revenue target"),
    marginTargetPct: num(p, "Margin target %"),
    shadeCount: num(p, "Shade count"),
    halalCompliant: select(p, "HALAL compliant"),
    briefLink: url(p, "Brief link"),
    projectStatus: select(p, "Project status"),
  };
}

function mapAction(page: PageObjectResponse): Action {
  const p = page.properties;
  return {
    id: page.id,
    note: title(p, "Action"),
    productId: relationId(p, "Product"),
    status: select(p, "Status") as ActionStatus | null,
    owner: text(p, "Owner"),
    dateLogged: dateStart(p, "Date logged"),
    source: select(p, "Source") as ActionSource | null,
  };
}

// --- Queries -------------------------------------------------------------

async function queryAll(dataSourceId: string, filter?: object) {
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    const res = await notion.dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      filter: filter as any,
    });
    for (const page of res.results) {
      if (isFullPage(page)) pages.push(page);
    }
    cursor = res.has_more ? res.next_cursor ?? undefined : undefined;
  } while (cursor);
  return pages;
}

export async function getClients(): Promise<Client[]> {
  const pages = await queryAll(DATA_SOURCES.clients);
  return pages.map(mapClient);
}

export async function getClient(id: string): Promise<Client> {
  const page = await notion.pages.retrieve({ page_id: id });
  if (!isFullPage(page)) throw new Error(`Client ${id} is not accessible`);
  return mapClient(page);
}

export async function getProducts(clientId?: string): Promise<Product[]> {
  const filter = clientId
    ? { property: "Client", relation: { contains: clientId } }
    : undefined;
  const pages = await queryAll(DATA_SOURCES.products, filter);
  return pages.map(mapProduct);
}

export async function getProduct(id: string): Promise<Product> {
  const page = await notion.pages.retrieve({ page_id: id });
  if (!isFullPage(page)) throw new Error(`Product ${id} is not accessible`);
  return mapProduct(page);
}

export async function createProduct(fields: {
  name: string;
  clientId: string;
  productCode?: string;
  campaign?: string;
  gateStage?: GateStage;
  launchType?: string;
  projectStatus?: string;
}): Promise<Product> {
  const properties: Record<string, object> = {
    "Product name": titleProp(fields.name),
    Client: relationProp(fields.clientId),
    "Gate stage": selectProp(fields.gateStage ?? "Pre-G1"),
    "Stage entered": dateProp(new Date().toISOString().slice(0, 10)),
    "Project status": selectProp(fields.projectStatus ?? "Active"),
  };
  if (fields.productCode) properties["Product code"] = textProp(fields.productCode);
  if (fields.campaign) properties.Campaign = textProp(fields.campaign);
  if (fields.launchType) properties["Launch type"] = selectProp(fields.launchType);

  const page = await notion.pages.create({
    parent: { type: "data_source_id", data_source_id: DATA_SOURCES.products },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    properties: properties as any,
  });
  if (!isFullPage(page)) throw new Error("Created product is not accessible");
  return mapProduct(page);
}

const PRODUCT_FIELD_WRITERS: {
  [K in keyof Product]?: (value: NonNullable<Product[K]>) => object;
} = {
  name: (v) => titleProp(v as string),
  productCode: (v) => textProp(v as string),
  campaign: (v) => textProp(v as string),
  gateStage: (v) => selectProp(v as string),
  stageEntered: (v) => dateProp(v as string),
  gateDecision: (v) => selectProp(v as string),
  nextGateDate: (v) => dateProp(v as string),
  launchType: (v) => selectProp(v as string),
  productLife: (v) => selectProp(v as string),
  brandManager: (v) => textProp(v as string),
  formulationLead: (v) => textProp(v as string),
  procurementLead: (v) => textProp(v as string),
  regulatoryLead: (v) => textProp(v as string),
  intendedSupplier: (v) => textProp(v as string),
  awardedSupplier: (v) => textProp(v as string),
  annualDemand: (v) => textProp(v as string),
  moq: (v) => numberProp(v as number),
  revenueTarget: (v) => numberProp(v as number),
  marginTargetPct: (v) => numberProp(v as number),
  shadeCount: (v) => numberProp(v as number),
  halalCompliant: (v) => selectProp(v as string),
  briefLink: (v) => ({ url: v as string }),
  projectStatus: (v) => selectProp(v as string),
};

const PRODUCT_NOTION_KEYS: Partial<Record<keyof Product, string>> = {
  name: "Product name",
  productCode: "Product code",
  campaign: "Campaign",
  gateStage: "Gate stage",
  stageEntered: "Stage entered",
  gateDecision: "Gate decision",
  nextGateDate: "Next gate date",
  launchType: "Launch type",
  productLife: "Product life",
  brandManager: "Brand manager",
  formulationLead: "Formulation lead",
  procurementLead: "Procurement lead",
  regulatoryLead: "Regulatory lead",
  intendedSupplier: "Intended supplier",
  awardedSupplier: "Awarded supplier",
  annualDemand: "Annual demand",
  moq: "MOQ",
  revenueTarget: "Revenue target",
  marginTargetPct: "Margin target %",
  shadeCount: "Shade count",
  halalCompliant: "HALAL compliant",
  briefLink: "Brief link",
  projectStatus: "Project status",
};

export async function updateProduct(
  id: string,
  fields: Partial<Product>
): Promise<Product> {
  const properties: Record<string, object> = {};
  for (const key of Object.keys(fields) as (keyof Product)[]) {
    const value = fields[key];
    const notionKey = PRODUCT_NOTION_KEYS[key];
    const writer = PRODUCT_FIELD_WRITERS[key];
    if (!notionKey || !writer || value === undefined || value === null) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    properties[notionKey] = (writer as (v: any) => object)(value);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const page = await notion.pages.update({ page_id: id, properties: properties as any });
  if (!isFullPage(page)) throw new Error(`Product ${id} is not accessible`);
  return mapProduct(page);
}

export async function getActions(productId: string): Promise<Action[]> {
  const pages = await queryAll(DATA_SOURCES.actions, {
    property: "Product",
    relation: { contains: productId },
  });
  return pages.map(mapAction);
}

export async function getActionsForProducts(productIds: string[]): Promise<Action[]> {
  if (productIds.length === 0) return [];
  const pages = await queryAll(DATA_SOURCES.actions, {
    or: productIds.map((id) => ({ property: "Product", relation: { contains: id } })),
  });
  return pages.map(mapAction);
}

export async function createAction(fields: {
  productId: string;
  note: string;
  owner?: string;
  status?: ActionStatus;
  source?: ActionSource;
  dateLogged?: string;
}): Promise<Action> {
  const properties: Record<string, object> = {
    Action: titleProp(fields.note),
    Product: relationProp(fields.productId),
    Status: selectProp(fields.status ?? "To do"),
    "Date logged": dateProp(fields.dateLogged ?? new Date().toISOString().slice(0, 10)),
    Source: selectProp(fields.source ?? "Manual"),
  };
  if (fields.owner) properties.Owner = textProp(fields.owner);

  const page = await notion.pages.create({
    parent: { type: "data_source_id", data_source_id: DATA_SOURCES.actions },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    properties: properties as any,
  });
  if (!isFullPage(page)) throw new Error("Created action is not accessible");
  return mapAction(page);
}

export async function updateAction(
  id: string,
  fields: Partial<{ note: string; status: ActionStatus; owner: string }>
): Promise<Action> {
  const properties: Record<string, object> = {};
  if (fields.note !== undefined) properties.Action = titleProp(fields.note);
  if (fields.status !== undefined) properties.Status = selectProp(fields.status);
  if (fields.owner !== undefined) properties.Owner = textProp(fields.owner);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const page = await notion.pages.update({ page_id: id, properties: properties as any });
  if (!isFullPage(page)) throw new Error(`Action ${id} is not accessible`);
  return mapAction(page);
}
