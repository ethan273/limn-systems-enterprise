-- ============================================================================
-- Flipbook RLS Policies Migration
-- ============================================================================
-- This migration adds RLS policies for flipbook-related tables.
-- These policies allow proper access control while maintaining security.
--
-- IMPORTANT: Apply this AFTER 20251024_enable_rls_security_fixes.sql
-- ============================================================================

-- ============================================================================
-- PART 1: Flipbooks Table Policies
-- ============================================================================

-- Policy: Users can read their own flipbooks
CREATE POLICY "users_read_own_flipbooks"
ON public.flipbooks
FOR SELECT
TO authenticated
USING (created_by_id = auth.uid());

-- Policy: Users can read published flipbooks (for public sharing)
CREATE POLICY "anyone_read_published_flipbooks"
ON public.flipbooks
FOR SELECT
TO authenticated, anon
USING (status = 'PUBLISHED'::public.flipbook_status);

-- Policy: Users can create flipbooks
CREATE POLICY "users_create_flipbooks"
ON public.flipbooks
FOR INSERT
TO authenticated
WITH CHECK (created_by_id = auth.uid());

-- Policy: Users can update their own flipbooks
CREATE POLICY "users_update_own_flipbooks"
ON public.flipbooks
FOR UPDATE
TO authenticated
USING (created_by_id = auth.uid())
WITH CHECK (created_by_id = auth.uid());

-- Policy: Users can delete their own flipbooks
CREATE POLICY "users_delete_own_flipbooks"
ON public.flipbooks
FOR DELETE
TO authenticated
USING (created_by_id = auth.uid());

-- ============================================================================
-- PART 2: Flipbook Pages Table Policies
-- ============================================================================

-- Policy: Users can read pages of their own flipbooks
CREATE POLICY "users_read_own_flipbook_pages"
ON public.flipbook_pages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.flipbooks
    WHERE flipbooks.id = flipbook_pages.flipbook_id
    AND flipbooks.created_by_id = auth.uid()
  )
);

-- Policy: Anyone can read pages of published flipbooks
CREATE POLICY "anyone_read_published_flipbook_pages"
ON public.flipbook_pages
FOR SELECT
TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM public.flipbooks
    WHERE flipbooks.id = flipbook_pages.flipbook_id
    AND flipbooks.status = 'PUBLISHED'::public.flipbook_status
  )
);

-- Policy: Users can create pages in their own flipbooks
CREATE POLICY "users_create_own_flipbook_pages"
ON public.flipbook_pages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.flipbooks
    WHERE flipbooks.id = flipbook_pages.flipbook_id
    AND flipbooks.created_by_id = auth.uid()
  )
);

-- Policy: Users can update pages in their own flipbooks
CREATE POLICY "users_update_own_flipbook_pages"
ON public.flipbook_pages
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.flipbooks
    WHERE flipbooks.id = flipbook_pages.flipbook_id
    AND flipbooks.created_by_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.flipbooks
    WHERE flipbooks.id = flipbook_pages.flipbook_id
    AND flipbooks.created_by_id = auth.uid()
  )
);

-- Policy: Users can delete pages from their own flipbooks
CREATE POLICY "users_delete_own_flipbook_pages"
ON public.flipbook_pages
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.flipbooks
    WHERE flipbooks.id = flipbook_pages.flipbook_id
    AND flipbooks.created_by_id = auth.uid()
  )
);

-- ============================================================================
-- PART 3: Hotspots Table Policies
-- ============================================================================

-- Policy: Users can read hotspots on pages of their own flipbooks
CREATE POLICY "users_read_own_hotspots"
ON public.hotspots
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.flipbook_pages
    JOIN public.flipbooks ON flipbooks.id = flipbook_pages.flipbook_id
    WHERE flipbook_pages.id = hotspots.page_id
    AND flipbooks.created_by_id = auth.uid()
  )
);

-- Policy: Anyone can read hotspots on published flipbook pages
CREATE POLICY "anyone_read_published_hotspots"
ON public.hotspots
FOR SELECT
TO authenticated, anon
USING (
  EXISTS (
    SELECT 1 FROM public.flipbook_pages
    JOIN public.flipbooks ON flipbooks.id = flipbook_pages.flipbook_id
    WHERE flipbook_pages.id = hotspots.page_id
    AND flipbooks.status = 'PUBLISHED'::public.flipbook_status
  )
);

-- Policy: Users can create hotspots on their own flipbook pages
CREATE POLICY "users_create_own_hotspots"
ON public.hotspots
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.flipbook_pages
    JOIN public.flipbooks ON flipbooks.id = flipbook_pages.flipbook_id
    WHERE flipbook_pages.id = hotspots.page_id
    AND flipbooks.created_by_id = auth.uid()
  )
);

-- Policy: Users can update hotspots on their own flipbook pages
CREATE POLICY "users_update_own_hotspots"
ON public.hotspots
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.flipbook_pages
    JOIN public.flipbooks ON flipbooks.id = flipbook_pages.flipbook_id
    WHERE flipbook_pages.id = hotspots.page_id
    AND flipbooks.created_by_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.flipbook_pages
    JOIN public.flipbooks ON flipbooks.id = flipbook_pages.flipbook_id
    WHERE flipbook_pages.id = hotspots.page_id
    AND flipbooks.created_by_id = auth.uid()
  )
);

-- Policy: Users can delete hotspots from their own flipbook pages
CREATE POLICY "users_delete_own_hotspots"
ON public.hotspots
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.flipbook_pages
    JOIN public.flipbooks ON flipbooks.id = flipbook_pages.flipbook_id
    WHERE flipbook_pages.id = hotspots.page_id
    AND flipbooks.created_by_id = auth.uid()
  )
);

-- ============================================================================
-- PART 4: Flipbook Versions Table Policies
-- ============================================================================

-- Policy: Users can read versions of their own flipbooks
CREATE POLICY "users_read_own_flipbook_versions"
ON public.flipbook_versions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.flipbooks
    WHERE flipbooks.id = flipbook_versions.flipbook_id
    AND flipbooks.created_by_id = auth.uid()
  )
);

-- Policy: Users can create versions of their own flipbooks
CREATE POLICY "users_create_own_flipbook_versions"
ON public.flipbook_versions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.flipbooks
    WHERE flipbooks.id = flipbook_versions.flipbook_id
    AND flipbooks.created_by_id = auth.uid()
  )
  AND created_by_id = auth.uid()
);

-- Policy: Users can update versions of their own flipbooks
CREATE POLICY "users_update_own_flipbook_versions"
ON public.flipbook_versions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.flipbooks
    WHERE flipbooks.id = flipbook_versions.flipbook_id
    AND flipbooks.created_by_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.flipbooks
    WHERE flipbooks.id = flipbook_versions.flipbook_id
    AND flipbooks.created_by_id = auth.uid()
  )
);

-- Policy: Users can delete versions of their own flipbooks
CREATE POLICY "users_delete_own_flipbook_versions"
ON public.flipbook_versions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.flipbooks
    WHERE flipbooks.id = flipbook_versions.flipbook_id
    AND flipbooks.created_by_id = auth.uid()
  )
);

-- ============================================================================
-- PART 5: Flipbook Share Links Table Policies
-- ============================================================================

-- Policy: Users can read their own share links
CREATE POLICY "users_read_own_share_links"
ON public.flipbook_share_links
FOR SELECT
TO authenticated
USING (created_by_id = auth.uid());

-- Policy: Anyone can read active share links by token (for public sharing)
CREATE POLICY "anyone_read_active_share_links_by_token"
ON public.flipbook_share_links
FOR SELECT
TO authenticated, anon
USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

-- Policy: Users can create share links for their own flipbooks
CREATE POLICY "users_create_own_share_links"
ON public.flipbook_share_links
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.flipbooks
    WHERE flipbooks.id = flipbook_share_links.flipbook_id
    AND flipbooks.created_by_id = auth.uid()
  )
  AND created_by_id = auth.uid()
);

-- Policy: Users can update their own share links
CREATE POLICY "users_update_own_share_links"
ON public.flipbook_share_links
FOR UPDATE
TO authenticated
USING (created_by_id = auth.uid())
WITH CHECK (created_by_id = auth.uid());

-- Policy: Users can delete their own share links
CREATE POLICY "users_delete_own_share_links"
ON public.flipbook_share_links
FOR DELETE
TO authenticated
USING (created_by_id = auth.uid());

-- ============================================================================
-- PART 6: Share Link Views Table Policies
-- ============================================================================

-- Policy: Users can read views of their own share links
CREATE POLICY "users_read_own_share_link_views"
ON public.share_link_views
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.flipbook_share_links
    WHERE flipbook_share_links.id = share_link_views.share_link_id
    AND flipbook_share_links.created_by_id = auth.uid()
  )
);

-- Policy: Anyone can create share link views (for analytics tracking)
CREATE POLICY "anyone_create_share_link_views"
ON public.share_link_views
FOR INSERT
TO authenticated, anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.flipbook_share_links
    WHERE flipbook_share_links.id = share_link_views.share_link_id
    AND flipbook_share_links.is_active = true
    AND (flipbook_share_links.expires_at IS NULL OR flipbook_share_links.expires_at > NOW())
  )
);

-- ============================================================================
-- VERIFICATION QUERIES (commented out - run manually to verify)
-- ============================================================================

-- Check all policies on flipbook tables:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- AND tablename IN ('flipbooks', 'flipbook_pages', 'flipbook_versions', 'flipbook_share_links', 'share_link_views', 'hotspots')
-- ORDER BY tablename, policyname;

-- ============================================================================
-- NOTES
-- ============================================================================
-- 1. All policies use auth.uid() to identify the current user
-- 2. Service role bypasses RLS, so server-side operations continue to work
-- 3. Anonymous users can view published flipbooks and their pages/hotspots
-- 4. Share link views can be created anonymously for analytics tracking
-- 5. All cascading deletes are handled by database constraints, not RLS
-- ============================================================================
