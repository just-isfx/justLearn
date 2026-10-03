<?php

namespace App\Console\Commands;

use DOMDocument;
use DOMElement;
use DOMNode;
use DOMText;
use DOMXPath;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

class FixLessonPunctuation extends Command
{
    protected $signature = 'lessons:fix-tts-punctuation {--dry-run : Report changes without updating the database}';

    protected $description = 'Add natural sentence punctuation to lesson HTML while preserving code blocks';

    private const PUNCTUATION = ['.', ':', '?', '!'];

    private const TARGET_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'blockquote'];

    public function handle(): int
    {
        $total = DB::table('lessons')->count();
        $updated = 0;
        $processed = 0;
        $dryRun = (bool) $this->option('dry-run');
        $bar = $this->output->createProgressBar($total);
        $bar->start();

        DB::table('lessons')->orderBy('id')->chunkById(50, function ($lessons) use ($bar, $dryRun, &$updated, &$processed): void {
            foreach ($lessons as $lesson) {
                $content = (string) $lesson->content;
                $corrected = $this->correctHtml($content);

                if ($corrected !== $content) {
                    $updated++;
                    if (! $dryRun) {
                        DB::table('lessons')->where('id', $lesson->id)->update(['content' => $corrected]);
                    }
                }

                $processed++;
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine(2);

        if ($dryRun) {
            $this->info("Dry run complete: {$processed} lessons checked; {$updated} would be updated.");
        } else {
            $this->info("Complete: {$processed} lessons checked; {$updated} updated.");
        }

        return self::SUCCESS;
    }

    private function correctHtml(string $html): string
    {
        if (trim($html) === '') {
            return $html;
        }

        $document = new DOMDocument('1.0', 'UTF-8');
        $previousErrorMode = libxml_use_internal_errors(true);

        try {
            $loaded = $document->loadHTML(
                '<!doctype html><html><head><meta charset="UTF-8"></head><body><div id="lesson-content-root">'
                    . $html
                    . '</div></body></html>',
                LIBXML_NONET | LIBXML_COMPACT
            );

            if (! $loaded) {
                return $html;
            }

            $xpath = new DOMXPath($document);
            $root = $xpath->query('//*[@id="lesson-content-root"]')->item(0);
            if (! $root) {
                return $html;
            }

            $targets = $xpath->query('.//*', $root);
            if (! $targets) {
                return $html;
            }

            foreach ($targets as $target) {
                if (! $target instanceof DOMElement || ! in_array(strtolower($target->tagName), self::TARGET_TAGS, true)) {
                    continue;
                }

                $this->punctuateElement($document, $target);
            }

            $result = '';
            foreach ($root->childNodes as $child) {
                $result .= $document->saveHTML($child);
            }

            return $result;
        } catch (Throwable) {
            return $html;
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previousErrorMode);
        }
    }

    private function punctuateElement(DOMDocument $document, DOMElement $element): void
    {
        $lastText = $this->findLastReadableText($element, $element);
        if (! $lastText) {
            return;
        }

        $visibleText = trim($lastText->nodeValue ?? '');
        if ($visibleText === '') {
            return;
        }

        $lastCharacter = mb_substr($visibleText, -1);
        if (in_array($lastCharacter, self::PUNCTUATION, true)) {
            return;
        }

        $punctuation = $this->punctuationFor($element);
        if ($this->isWithinInlineCode($lastText, $element)) {
            $this->insertAfterCode($document, $lastText, $element, $punctuation);
            return;
        }

        $value = $lastText->nodeValue ?? '';
        $trimmed = rtrim($value);
        $trailingWhitespace = substr($value, strlen($trimmed));
        $lastText->nodeValue = $trimmed . $punctuation . $trailingWhitespace;
    }

    private function findLastReadableText(DOMNode $node, DOMElement $target): ?DOMText
    {
        for ($index = $node->childNodes->length - 1; $index >= 0; $index--) {
            $child = $node->childNodes->item($index);
            if ($child instanceof DOMText && trim($child->nodeValue ?? '') !== '') {
                return $child;
            }

            if (! $child instanceof DOMElement) {
                continue;
            }

            $tag = strtolower($child->tagName);
            if ($tag === 'pre' || $tag === 'script' || $tag === 'style') {
                continue;
            }

            if (strtolower($target->tagName) === 'li' && in_array($tag, ['ul', 'ol'], true)) {
                continue;
            }

            $lastText = $this->findLastReadableText($child, $target);
            if ($lastText) {
                return $lastText;
            }
        }

        return null;
    }

    private function punctuationFor(DOMElement $element): string
    {
        if (preg_match('/^h[1-6]$/i', $element->tagName)) {
            $next = $this->nextElementSibling($element);
            if ($next && in_array(strtolower($next->tagName), ['ul', 'ol', 'table', 'pre'], true)) {
                return ':';
            }
        }

        return '.';
    }

    private function nextElementSibling(DOMNode $node): ?DOMElement
    {
        for ($sibling = $node->nextSibling; $sibling; $sibling = $sibling->nextSibling) {
            if ($sibling instanceof DOMElement) {
                return $sibling;
            }
        }

        return null;
    }

    private function isWithinInlineCode(DOMNode $node, DOMElement $target): bool
    {
        for ($parent = $node->parentNode; $parent && $parent !== $target; $parent = $parent->parentNode) {
            if ($parent instanceof DOMElement && strtolower($parent->tagName) === 'code') {
                return true;
            }
        }

        return false;
    }

    private function insertAfterCode(DOMDocument $document, DOMText $text, DOMElement $target, string $punctuation): void
    {
        $branch = $text;
        while ($branch->parentNode && $branch->parentNode !== $target) {
            $branch = $branch->parentNode;
        }

        if ($branch->parentNode === $target) {
            $target->insertBefore($document->createTextNode($punctuation), $branch->nextSibling);
            return;
        }

        $target->appendChild($document->createTextNode($punctuation));
    }
}