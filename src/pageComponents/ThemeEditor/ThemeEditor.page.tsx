"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { api } from "~/trpc/react";
import { LoadingScreen } from "~/components/Loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useToast } from "~/components/ui/use-toast";
import { type MenuTheme, DEFAULT_THEME, buildGoogleFontsUrl } from "~/lib/theme";
import dynamic from "next/dynamic";
import {
  ColorSection,
  TypographySection,
  LayoutSection,
  SpacingSection,
  DisplaySection,
  TemplatesSection,
  BrandSection,
  ThemeActions,
  SectionDivider,
  groupFontsByCategory,
  themesAreEqual,
  mapServerThemeToLocal,
} from "./components";

// Lazy-load the live preview panel - it fetches menu data and renders a
// full themed menu preview, so splitting it keeps the editor controls fast
const ThemePreview = dynamic(
  () => import("./ThemePreview").then((mod) => ({ default: mod.ThemePreview })),
  { loading: () => <div className="flex h-96 items-center justify-center text-muted-foreground">Loading preview...</div> },
);

import { Palette, LayoutGrid, Eye, Sparkles, Circle, Stamp } from "lucide-react";

// ── Main component ──────────────────────────────────────────

export function ThemeEditorPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { slug } = useParams() as { slug?: string };

  // ---- Theme state ----
  const [theme, setTheme] = useState<MenuTheme>(DEFAULT_THEME);
  const [savedTheme, setSavedTheme] = useState<MenuTheme>(DEFAULT_THEME);

  // ---- Get menu data (for menuId lookup and preview) ----
  const { data: menuData, isLoading: menuLoading } =
    api.menus.getMenuBySlug.useQuery(
      { slug: slug ?? "" },
      { enabled: !!slug },
    );

  const menuId = menuData?.id ?? "";

  // ---- Get saved theme from server ----
  const { data: serverTheme, isLoading: themeLoading } =
    api.theme.getTheme.useQuery({ menuId }, { enabled: !!menuId });

  // ---- Get templates from server ----
  const { data: templates } = api.theme.getTemplates.useQuery();

  // ---- Get fonts from server (uses theme.getFonts) ----
  const { data: fontsFromServer } = api.theme.getFonts.useQuery();

  // ---- Group fonts by category (memoized) ----
  const fontGroups = useMemo(() => {
    if (!fontsFromServer) return {};

    return groupFontsByCategory(fontsFromServer);
  }, [fontsFromServer]);

  // ---- Hydrate from server when theme data arrives ----
  useEffect(() => {
    if (serverTheme) {
      const mapped = mapServerThemeToLocal(serverTheme);

      setTheme(mapped);
      setSavedTheme(mapped);
    }
  }, [serverTheme]);

  // ---- Track unsaved changes ----
  const hasUnsavedChanges = useMemo(
    () => !themesAreEqual(theme, savedTheme),
    [theme, savedTheme],
  );

  // ---- Update helper ----
  const update = useCallback(
    <K extends keyof MenuTheme>(key: K, value: MenuTheme[K]) => {
      setTheme((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  // ---- Mutations ----
  const saveMutation = api.theme.saveTheme.useMutation({
    onSuccess: () => {
      setSavedTheme(theme);
      toast({
        title: t("themeEditor.saved"),
        description: t("themeEditor.savedDescription"),
      });
    },
    onError: () => {
      toast({
        title: t("themeEditor.saveFailed"),
        description: t("themeEditor.saveFailedDescription"),
        variant: "destructive",
      });
    },
  });

  const resetMutation = api.theme.resetTheme.useMutation({
    onSuccess: () => {
      setTheme(DEFAULT_THEME);
      setSavedTheme(DEFAULT_THEME);
      toast({
        title: t("themeEditor.resetDone"),
        description: t("themeEditor.resetDoneDescription"),
      });
    },
    onError: () => {
      toast({
        title: t("themeEditor.saveFailed"),
        variant: "destructive",
      });
    },
  });

  const applyTemplateMutation = api.theme.applyTemplate.useMutation({
    onSuccess: (data) => {
      if (data) {
        const mapped = mapServerThemeToLocal(data);

        setTheme(mapped);
      }

      toast({
        title: t("themeEditor.templateApplied"),
        description: t("themeEditor.templateAppliedDescription"),
      });
    },
  });

  // ---- Handlers ----
  const handleSave = useCallback(() => {
    if (!menuId) return;
    saveMutation.mutate({ menuId, ...theme });
  }, [menuId, theme, saveMutation]);

  const handleReset = useCallback(() => {
    if (!menuId) return;
    resetMutation.mutate({ menuId });
  }, [menuId, resetMutation]);

  const handleApplyTemplate = useCallback(
    (mId: string, templateId: string) => {
      applyTemplateMutation.mutate({ menuId: mId, templateId });
    },
    [applyTemplateMutation],
  );

  // ---- Google Fonts link ----
  const fontsUrl = useMemo(() => buildGoogleFontsUrl(theme), [theme]);

  // ---- Loading state ----
  if (menuLoading || themeLoading) return <LoadingScreen />;

  if (!slug) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Palette className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {t("themeEditor.noMenuSelected")}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={fontsUrl} />

      <div className="flex h-[calc(100vh-120px)]">
        {/* -- LEFT PANEL: Controls -- */}
        <aside className="flex w-[420px] shrink-0 flex-col border-r border-border/50 bg-card/50">
          {/* Panel header with unsaved indicator */}
          <div className="flex items-center justify-between border-b border-border/30 px-6 py-4">
            <div>
              <h2 className="text-base font-semibold">
                {t("themeEditor.title")}
              </h2>
              <p className="text-xs text-muted-foreground">
                {t("themeEditor.description")}
              </p>
            </div>
            {hasUnsavedChanges && (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 dark:bg-amber-900/30">
                <Circle className="h-2 w-2 fill-amber-500 text-amber-500" />
                <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {t("themeEditor.unsaved")}
                </span>
              </div>
            )}
          </div>

          {/* Scrollable content area with tabs */}
          <div className="flex-1 overflow-y-auto">
            <Tabs defaultValue="templates" className="w-full">
              <div className="sticky top-0 z-10 border-b border-border/30 bg-card/95 px-4 pt-3 backdrop-blur-sm">
                <TabsList className="w-full">
                  <TabsTrigger value="templates" className="flex-1 text-xs">
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    {t("themeEditor.templates")}
                  </TabsTrigger>
                  <TabsTrigger value="brand" className="flex-1 text-xs">
                    <Stamp className="mr-1.5 h-3.5 w-3.5" />
                    {t("themeEditor.brandTab")}
                  </TabsTrigger>
                  <TabsTrigger value="style" className="flex-1 text-xs">
                    <Palette className="mr-1.5 h-3.5 w-3.5" />
                    {t("themeEditor.styleTab")}
                  </TabsTrigger>
                  <TabsTrigger value="layout" className="flex-1 text-xs">
                    <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
                    {t("themeEditor.layout")}
                  </TabsTrigger>
                  <TabsTrigger value="display" className="flex-1 text-xs">
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    {t("themeEditor.display")}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="templates" className="px-6 py-4">
                <TemplatesSection
                  templates={templates}
                  menuId={menuId}
                  isApplying={applyTemplateMutation.isLoading}
                  onApplyTemplate={handleApplyTemplate}
                />
              </TabsContent>

              <TabsContent value="brand" className="px-6 py-4">
                <BrandSection
                  theme={theme}
                  onUpdate={update}
                  logoUrl={menuData?.logoImageUrl}
                  slug={slug}
                />
              </TabsContent>

              <TabsContent value="style" className="px-6 py-4">
                <ColorSection theme={theme} onUpdate={update} />
                <SectionDivider />
                <TypographySection
                  theme={theme}
                  onUpdate={update}
                  fontGroups={fontGroups}
                />
              </TabsContent>

              <TabsContent value="layout" className="px-6 py-4">
                <LayoutSection theme={theme} onUpdate={update} />
                <SectionDivider />
                <SpacingSection theme={theme} onUpdate={update} />
              </TabsContent>

              <TabsContent value="display" className="px-6 py-4">
                <DisplaySection theme={theme} onUpdate={update} />
              </TabsContent>
            </Tabs>
          </div>

          {/* -- Action Buttons (sticky footer) -- */}
          <ThemeActions
            onSave={handleSave}
            onReset={handleReset}
            isSaving={saveMutation.isLoading}
            isResetting={resetMutation.isLoading}
            hasUnsavedChanges={hasUnsavedChanges}
          />
        </aside>

        {/* -- RIGHT PANEL: Live Preview -- */}
        <main className="flex-1 overflow-auto bg-muted/30 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              {t("themeEditor.preview")}
            </h2>
          </div>
          <ThemePreview theme={theme} />
        </main>
      </div>
    </>
  );
}
