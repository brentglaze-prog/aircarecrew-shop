create policy product_vendor_links_service_all
on public.product_vendor_links
for all
to service_role
using (true)
with check (true);
