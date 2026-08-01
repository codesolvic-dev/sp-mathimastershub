# SpFolio / SP Builder

> v 1.0.3 — July 2026

---

## [1.0.3] - 2026-07-20

### Added

- **Developer → Control Panel** tab for site-wide controls.
- **Website Maintenance Mode**
  - On/Off toggle for public site access.
  - Full page customization: background (solid / gradient / image), overlay, blur.
  - Title, subtitle, footer text with color and font size controls.
  - Countdown timer (end date & time).
  - Contact info, logo max-width, social icons, CTA button colors.
  - Access Settings (admin / developer / auth exempt paths).
  - SEO Settings (title, description, noindex).
  - Advanced (redirect URL, custom CSS).
  - Live preview with Desktop / Tablet / Mobile views.
  - Sticky actions: Reset, Preview, Enable/Disable, Save.
- **Company → Order acceptance**
  - Temporarily stop accepting new orders without taking the site offline.
  - Custom pause message shown on cart and checkout.
  - Backend blocks `create order` when acceptance is off.
- Control Panel displays **app version** and release changelog summary.



========================================
7/21/2026
1. in Device Config fetch company website url
2. Admin graphs Revenue Trend, Orders add duration selection
3. add control panel in Admin Tabs
4. in Queries use [Report] not [User Report]
5. Blog side bar not proper working on scroll


7/22/2026
1. Error on desktop view in app
5. Assets → Banners: Banner 2 should display based on the selected theme
10. Test Operators permissions and ensure admins can assign access
11. In Queries, use "Report" instead of "User Report"
12. Manage Dynamic Content Page Types
13. Show company name instead of the loader message ("GraceByAnu"); also update the alternate brand name
14. Manage Join SP in the footer
19. Review and improve Collections management




=============== In Progress ======================
2. In Device Config, fetch company website URL
3. Admin graphs: Revenue Trend & Orders – add duration selection
4. Show logged-in user email in the top admin sidebar under Admin
6. Enable switch for Welcome Popup; when disabled, do not display it
7. Enable switch for Announcement Bar; when disabled, do not display it
8. Move Announcement Bar and Welcome Popup to Control Panel
9. Add Control Panel in Admin Tabs
15. Fix Blog sidebar functionality
16. Clear Hero Banner data or create a copy with Style 2 (banners only)
17. Fix Hero Banner size to 1080 × 540
18. Hide banner at the top of the Shop page
19. Polices Page Content
20. Product Import , Export

~~21. Sp panel ma ak table add krdena like operator ki copy — Admin Login tab + inactive login block~~



================= 25-07-2026 ========================
client points
-------------------------------
Opal Luxe  
2. Ise ka banner ka color thora dim (like dar shade ka bad show hu raha ha ) ager gallery ya simple dakhy tu kafi light color shaow huta ha
Care & Cured 
4. 1st Logo change 
5. 2nd Name ka font hcange krna ha
6. Ma na abhi 2 order kia hain wo opal ka dashboard per notification nahi aya lakin care ka dashboard per notification aya ha (Notification care waly per a raha ha or order opal per show krwa raha ha) - in end
7. or ise ka ulat same care ka notification opal per ja raha ha or order care ka care ma hi ha
8. abhi refresh kia ha sword or opal wali website per grace by anuu and sara data change nazar a raha ha - solved now
Sword Empire 
10. 1st:- Ise ka jo name likha ha wo simple font kr daye 
11. 2nd:- ya mark option end kr daye or yaha sirf 1 item add krna ha Hide Arrows
12. 3rd:- 3no section ma 1st swords,2nd pocket knife,3rd axes krna ha
13. 4th:- sales waly section ka bad ya reals wala section aye ga jis ma hum product ki videso add kr gaye
14. 5th:- sab items ka bad blogs wala section and ise ka bad reviews or blogs sirf asy 3 hu front per
15. 1 or point ha ager possible hu tu hmari her website ma pintrest ka nichy logo show krwa daye jasy tiktok and sab social media ka show huty hain
16. Company Profile Links dynamic Pintrest | Snapchat
17. Company name font and size changeable
18. Google map location in company for contact us from

===========================27-07-2026===========================

yh kosh points
---------------------------
1. User page control setting
2. forgot mail design fix
3. Data change from theme one “Anu” to Splorem
4. Test Operators are working; admin can give them access
5. In Device Config, fetch company website URL
6. ---------------
7. Join SP manage in footer
8. AI section guide HTML inline
9. Media URL copy
10. Google Site Kit | Search Console | Meta Pixel
11. Navbae tabs alignment or settings
12. Add Product pe ab % Off aur Demo Videos dono default unchecked hain.
13. Sidebar ab dropdown hai:
      Third-Party Services ▾
      Meta Pixel
      Google Search Console
      Har ek alag page pe khulta hai. Refresh karke Developer panel check karo.
14. Meta Pixel integration
15. SpEditor header mein sparkles icon pe click karo  AI section guide
16. 



later → Enable switch button welcome popup if off then not show body
later → Enable switch button Announcement bar if off then not show body
later → move Announcement bar & welcome popup in control panel
later → show company name insted of Loader message ""GraceByAnu" also change name alternate ro brand

### Changed

- Developer sidebar: **Control Panel** is the first menu item; `/developer` opens Control Panel by default.
- Checkout and cart: respect order-acceptance flag (disabled checkout when paused).
- Welcome popup does not show while maintenance mode is active.

### Fixed

- Control Panel sticky footer no longer overlaps the developer sidebar (“Reset to Default” placement).

### Documentation

- Added `doc/CHANGELOG_1.0.3.md`.

---
