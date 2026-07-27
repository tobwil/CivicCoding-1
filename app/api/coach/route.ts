const gameCatalog = [
  {
    id: "6",
    title: "Kartenstaffel: Mit Reifen",
    audience: "Grundschule",
    materials: ["Reifen", "Hütchen"],
    strengths: ["Teamgefühl", "Koordination", "Auspowern"],
  },
  {
    id: "7",
    title: "Räuberhöhle: Fangspiel und Schatzjagd",
    audience: "Grundschule",
    materials: ["Hütchen", "ohne Material"],
    strengths: ["Teamgefühl", "Auspowern", "Koordination"],
  },
  {
    id: "10",
    title: "Funiño: Spielwitz im Basketball",
    audience: "Grundschule",
    materials: ["Bälle", "Hütchen"],
    strengths: ["Ballgefühl", "Teamgefühl", "Koordination"],
  },
  {
    id: "15",
    title: "King Kong kommt: Monströses Fangspiel",
    audience: "Kita und Grundschule",
    materials: ["ohne Material", "Hütchen"],
    strengths: ["Auspowern", "Koordination"],
  },
  {
    id: "17",
    title: "Gagaball: Zielspiel mit rollenden Bällen",
    audience: "Grundschule",
    materials: ["Bälle", "Hütchen"],
    strengths: ["Ballgefühl", "Auspowern", "Koordination"],
  },
  {
    id: "20",
    title: "Schlangendiebe: Schnelles Laufspiel in Teams",
    audience: "Grundschule",
    materials: ["Hütchen", "ohne Material"],
    strengths: ["Teamgefühl", "Auspowern", "Koordination"],
  },
  {
    id: "23",
    title: "Hundehütte: Rasantes Lauf- und Fangspiel",
    audience: "Grundschule",
    materials: ["ohne Material", "Hütchen"],
    strengths: ["Auspowern", "Teamgefühl"],
  },
  {
    id: "30",
    title: "Küstenwache: Fangspiel auf hoher See",
    audience: "Kita und Grundschule",
    materials: ["ohne Material", "Hütchen"],
    strengths: ["Auspowern", "Koordination", "Teamgefühl"],
  },
];

const allowedModels = new Set([
  "gpt-5.6-luna",
  "gpt-5.6-terra",
  "gpt-5.6",
]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
    const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
    const model = allowedModels.has(body.model) ? body.model : "gpt-5.6-luna";
    const context = body.context ?? {};

    if (!prompt || prompt.length > 800) {
      return Response.json(
        { error: "Bitte beschreibe deine Situation in höchstens 800 Zeichen." },
        { status: 400 },
      );
    }
    if (!apiKey) {
      return Response.json(
        { error: "Für den Live-Modus fehlt ein OpenAI API-Key." },
        { status: 400 },
      );
    }

    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        reasoning: { effort: "low" },
        max_output_tokens: 1400,
        instructions:
          "Du bist Coach AI von ALBA BERLIN: ein erfahrener, warmherziger Sportpädagoge. Baue aus einer unperfekten Alltagsschilderung eine konkrete, sofort durchführbare Bewegungseinheit. Nutze ausschließlich Spiel-IDs aus dem bereitgestellten Katalog. Gib drei Phasen aus: ANKOMMEN, ACTION und LANDEN. Die Dauer der drei Phasen soll ungefähr der verfügbaren Gesamtzeit entsprechen. Schreibe knapp, energiegeladen, inklusiv und ohne pädagogische Floskeln. Erfinde keine Sicherheitsfreigaben. Wenn Angaben fehlen, triff eine vorsichtige praktische Annahme.",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `Situation: ${prompt}\nVorwahl aus dem Filter: ${JSON.stringify(context)}\nVerfügbare ALBAthek-Spiele: ${JSON.stringify(gameCatalog)}`,
              },
            ],
          },
        ],
        text: {
          verbosity: "low",
          format: {
            type: "json_schema",
            name: "albathek_coach_plan",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: {
                headline: { type: "string" },
                read: { type: "string" },
                coachNote: { type: "string" },
                timeline: {
                  type: "array",
                  minItems: 3,
                  maxItems: 3,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      phase: {
                        type: "string",
                        enum: ["ANKOMMEN", "ACTION", "LANDEN"],
                      },
                      duration: { type: "integer", minimum: 3, maximum: 60 },
                      title: { type: "string" },
                      gameId: {
                        type: "string",
                        enum: gameCatalog.map((game) => game.id),
                      },
                      reason: { type: "string" },
                      tip: { type: "string" },
                    },
                    required: [
                      "phase",
                      "duration",
                      "title",
                      "gameId",
                      "reason",
                      "tip",
                    ],
                  },
                },
              },
              required: ["headline", "read", "coachNote", "timeline"],
            },
          },
        },
      }),
    });

    const payload = await openAIResponse.json();
    if (!openAIResponse.ok) {
      const message =
        payload?.error?.message ??
        "OpenAI konnte diese Anfrage gerade nicht verarbeiten.";
      return Response.json({ error: message }, { status: openAIResponse.status });
    }

    const outputText = payload.output
      ?.flatMap((item: { content?: Array<{ type: string; text?: string; refusal?: string }> }) =>
        item.content ?? [],
      )
      .find((item: { type: string }) => item.type === "output_text")?.text;

    if (!outputText) {
      const refusal = payload.output
        ?.flatMap((item: { content?: Array<{ type: string; refusal?: string }> }) =>
          item.content ?? [],
        )
        .find((item: { type: string }) => item.type === "refusal")?.refusal;
      throw new Error(refusal ?? "Coach AI hat keinen Spielplan zurückgegeben.");
    }

    return Response.json({ plan: JSON.parse(outputText) });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Coach AI ist gerade nicht erreichbar.",
      },
      { status: 500 },
    );
  }
}
