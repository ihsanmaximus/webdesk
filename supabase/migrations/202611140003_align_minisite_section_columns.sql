alter table public.minisite_sections
  add column if not exists section_name text,
  add column if not exists subheading text,
  add column if not exists date_label text;

comment on column public.minisite_sections.section_name is 'Display label/name of the section configured in the backend.';
comment on column public.minisite_sections.title is 'Main heading displayed inside the section.';
comment on column public.minisite_sections.subheading is 'Supporting subtitle/description displayed below the section heading.';
comment on column public.minisite_sections.date_label is 'Optional date-range label, used by the schedule section.';
