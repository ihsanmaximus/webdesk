# Webdesk Minisite Backend

## Supabase project
- Project: `webdesk`
- Project ref: `akvnhvlerntpwkldilvc`
- Region: `ap-northeast-2`

## Database
The schema contains:
- `minisites`: one record per microsite; title is limited to 3 words and slug is unique.
- `minisite_sections`: ordered, visible/hidden page sections. Section content is stored as JSONB so repeated cards/items remain configurable.
- `minisite_registrations`: public registration submissions.

Supported section types:
`navbar`, `hero`, `hero_image`, `materi_acara`, `schedule`, `speakers`, `pricing`, `registration`, `footer`, `sticky_cta`.

## Public API
Configure these Vercel environment variables:
- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_ANON_KEY`: Supabase publishable/anon key.

Never put the service-role key in browser code or this public endpoint.

### Read a published minisite
`GET /api/minisites/{slug}`

Returns the published minisite settings and visible sections ordered by `sort_order`.

### Submit a registration
`POST /api/minisites/{slug}`

JSON body:
```json
{
  "full_name": "Nama Peserta",
  "whatsapp": "6281234567890",
  "email": "peserta@example.com",
  "education": "Fresh Graduate S1/D4/D3",
  "selected_package": "Paket Online",
  "answers": {}
}
```

## Route requirement
The public URL is the root slug, for example `/{slug}`. Do not add `/event/` or `/minisite/` before the slug.

## Security model
RLS is enabled on all three tables. Anonymous and authenticated clients can read published minisites and their sections, and can insert registrations only for published minisites. Registration rows are not publicly readable. Privileged content management (create/edit/publish) must be performed by a trusted server using a service-role secret, never by the browser.
