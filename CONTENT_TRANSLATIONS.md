# Translation-ready content

The application interface is translated through the React locale files in
`frontend/src/locales`. Educational records keep their canonical title,
description, and content on the existing course, lesson, and library tables.

The `content_translations` table is the extension point for future translated
content. Its polymorphic `translatable` relation identifies the source record,
`locale` stores a supported language code, and the nullable title,
description, and content columns store translated fields. This avoids copying
courses, lessons, or articles while keeping database values language-independent.

When content translation is introduced, read the requested locale first and
fall back to the canonical fields when no translation exists. New locale codes
should be added to `config/languages.php` and the matching React locale
resource before content translations are created.
