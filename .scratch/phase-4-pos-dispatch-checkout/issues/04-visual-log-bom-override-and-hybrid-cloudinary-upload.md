# 04: Visual Log (Technical Log), Actual BOM Override & Hybrid Cloudinary Photo Upload

**What to build:** Inside the POS Order Drawer, opening **Tab 2 (Công thức pha chế & Ảnh kết quả — `Visual Log`)** automatically populates the chemical consumption table with the standard `BOM` quantities (`ml`/`g`) aggregated from all services in the `Order`. Technicians or receptionists can adjust the actual `ml`/`g` amounts used, add extra consumable products, enter `Formula Notes` and `Hair Condition Notes`, and upload `Before` and `After` treatment photographs. Photo uploads use a Hybrid Cloudinary service that uploads directly to Cloudinary when cloud credentials are configured and automatically falls back to local static storage when running in local/sandbox environments.

**Blocked by:** 02: POS Dispatch Board (Kanban & Timeline), Booking Check-In & Walk-In Order Creation

**Status:** ready-for-agent

- [ ] Fetching the `Visual Log` for an `Order` that has no saved `actual_bom_json` yet synthesizes and returns the baseline consumable chemical rows (`productId`, `productName`, `standardAmount`, `actualAmount`, `unit`) from the standard `BOM` of all active services on the `Order`.
- [ ] Saving the `Visual Log` persists `formula_notes`, `hair_condition_notes`, `before_image_url`, `after_image_url`, technician `staff_id`, and the customized `actual_bom_json` chemical quantities on the order's `TechnicalLog` record.
- [ ] Uploading a `Before` or `After` photograph via the media upload endpoint validates image format/size, uploads to Cloudinary (`smartsalon/visual-logs`) when Cloudinary credentials are configured, or stores and serves the image from local static storage (`/uploads/visual-logs/**`) in local/sandbox mode.
- [ ] Tab 2 of the POS Order Drawer allows editing actual chemical `ml`/`g` amounts, adding extra consumables from catalog products, editing technical notes, uploading `Before` and `After` photos with side-by-side preview, and saving the `Visual Log`.
- [ ] Automated backend tests verify baseline `BOM` synthesis, `Visual Log` persistence with `actual_bom_json` overrides, and multipart image upload in local fallback mode.
