import { NextRequest, NextResponse } from "next/server"

interface Subtitle {
  start: number
  end: number
  text: string
}

function parseSRT(srtText: string): Subtitle[] {
  const subtitles: Subtitle[] = []
  const blocks = srtText.trim().split("\n\n")

  for (const block of blocks) {
    const lines = block.split("\n")
    if (lines.length < 3) continue

    const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/)
    if (!timeMatch) continue

    const start =
      parseInt(timeMatch[1], 10) * 3600 +
      parseInt(timeMatch[2], 10) * 60 +
      parseInt(timeMatch[3], 10) +
      parseInt(timeMatch[4], 10) / 1000

    const end =
      parseInt(timeMatch[5], 10) * 3600 +
      parseInt(timeMatch[6], 10) * 60 +
      parseInt(timeMatch[7], 10) +
      parseInt(timeMatch[8], 10) / 1000

    subtitles.push({
      start,
      end,
      text: lines.slice(2).join("\n"),
    })
  }

  return subtitles
}

export async function GET(request: NextRequest) {
  try {
    const tmdbId = request.nextUrl.searchParams.get("id")
    const mediaType = request.nextUrl.searchParams.get("type") || "movie"
    const season = request.nextUrl.searchParams.get("season") || "1"
    const episode = request.nextUrl.searchParams.get("episode") || "1"

    if (!tmdbId) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    const apiKey = process.env.OPENSUBTITLES_API_KEY || process.env.NEXT_PUBLIC_OPENSUBTITLES_API_KEY
    const userAgent = process.env.OPENSUBTITLES_USER_AGENT || "ChillFlix v1"

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing OPENSUBTITLES_API_KEY (or NEXT_PUBLIC_OPENSUBTITLES_API_KEY)" },
        { status: 500 }
      )
    }

    const query = new URLSearchParams({
      tmdb_id: tmdbId,
      languages: "ar",
      type: mediaType === "tv" ? "episode" : "movie",
    })

    if (mediaType === "tv") {
      query.set("season_number", season)
      query.set("episode_number", episode)
    }

    const subtitlesResponse = await fetch(`https://api.opensubtitles.com/api/v1/subtitles?${query.toString()}`, {
      headers: {
        "Api-Key": apiKey,
        "User-Agent": userAgent,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!subtitlesResponse.ok) {
      const details = await subtitlesResponse.text()
      return NextResponse.json(
        {
          error: "OpenSubtitles search failed",
          status: subtitlesResponse.status,
          details,
        },
        { status: subtitlesResponse.status }
      )
    }

    const subtitlesData = await subtitlesResponse.json()
    const subtitleItems = Array.isArray(subtitlesData?.data) ? subtitlesData.data : []

    if (subtitleItems.length === 0) {
      return NextResponse.json({ subtitles: [] })
    }

    const bestSubtitle = subtitleItems.sort((a: any, b: any) => {
      const aCount = a?.attributes?.download_count ?? 0
      const bCount = b?.attributes?.download_count ?? 0
      return bCount - aCount
    })[0]

    const fileId = bestSubtitle?.attributes?.files?.[0]?.file_id
    if (!fileId) {
      return NextResponse.json({ subtitles: [] })
    }

    const downloadResponse = await fetch("https://api.opensubtitles.com/api/v1/download", {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "User-Agent": userAgent,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ file_id: fileId }),
      cache: "no-store",
    })

    if (!downloadResponse.ok) {
      const details = await downloadResponse.text()
      return NextResponse.json(
        {
          error: "OpenSubtitles download failed",
          status: downloadResponse.status,
          details,
        },
        { status: downloadResponse.status }
      )
    }

    const downloadData = await downloadResponse.json()
    const subtitleUrl = downloadData?.link

    if (!subtitleUrl) {
      return NextResponse.json({ subtitles: [] })
    }

    const srtResponse = await fetch(subtitleUrl, { cache: "no-store" })
    if (!srtResponse.ok) {
      return NextResponse.json({ subtitles: [] })
    }

    const srtText = await srtResponse.text()
    return NextResponse.json({ subtitles: parseSRT(srtText) })
  } catch (error) {
    console.error("Subtitle route error:", error)
    return NextResponse.json({ error: "Internal subtitle error" }, { status: 500 })
  }
}
