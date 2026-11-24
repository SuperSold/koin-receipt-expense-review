# Koin Receipt Scan & Expense Review

A React Native / Expo implementation of the Koin receipt upload and expense review flow.

## Run locally

Requirements: Node.js 22.13 or newer, npm, and Expo Go on a device (or an iOS Simulator / Android Emulator).

```sh
npm install
npm start
```

Scan the Expo Go QR code, or press `i` / `a` in the Expo terminal to open an available simulator. The camera and gallery actions request the matching device permission. On a simulator, Gallery is the easiest way to try an image; the app shows that image as the receipt thumbnail.

## Easy testing build (Expo Go)

The published preview includes Android and iOS bundles. Install Expo Go, then scan this QR code from your device camera to open the receipt-review flow:

![Scan with Expo Go to open the Koin preview](https://qr.expo.dev/eas-update?projectId=45046f78-c7ca-440c-853c-bc7a438cda95&groupId=d7a1276c-e941-46b2-8c35-e42b6a25c724&slug=exp)

You can also [open the published update in the Expo dashboard](https://expo.dev/accounts/mubashir_4/projects/koin-expenses/updates/d7a1276c-e941-46b2-8c35-e42b6a25c724) and select **Preview** to show the QR code. The update is published on the `preview` branch for runtime version `1.0.0`.

**Access note:** Expo Go requires testers to sign in with an Expo account that owns this project or is a member of its owning organization. Reviewers without project access will need to be granted access through an Expo organization before the QR can open for them.

To publish later changes, sign in with `eas login` and run `eas update --branch preview --message "Describe the update" --environment preview`. For a temporary development session instead, run `npm run preview` and keep the terminal open while testers use its generated QR code.

## Try the review flow

- Tap **Scan Bill** and choose **Take a photo** or **Choose from gallery**. The upload card also has Camera and Gallery shortcuts.
- Review fields are editable. Choose a category from the category pill; merchant and date are text fields.
- Change item names or prices, add rows, or delete rows. The total is recalculated from integer cents as you edit.
- Save requires a merchant, date, and at least one named item with a price above $0.00. A successful save appears at the top of Recent Activity.

## Implementation notes

- Receipt parsing is simulated with the Cafe Kumbuk preset from the design. This makes the complete editing flow available without credentials or a network service. A picked photo is previewed, while the same sample fields are used as extraction output.
- `App.tsx` keeps this focused prototype self-contained: receipt editing state stays local until confirmation, and the expense feed updates only after validation succeeds.
- Prices are represented as integer cents, avoiding floating-point accumulation errors. Amounts use tabular numerals and are formatted as USD.
- React Native `KeyboardAvoidingView`, safe areas, Expo Image Picker, and a category selection sheet cover the main platform interactions.
- The assignment brief and design references are preserved in `assignment/`.

## Design references

- `assignment/Koin_Engineering_Challenge.pdf`
- `assignment/Koin_Expenses.png`
- `assignment/Koin_Review_receipt.png`
