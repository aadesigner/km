import { describe, expect, it } from "vitest";
import {
  EMPTY_VIN_CATALOG_FORM,
  vinCatalogFormFromData,
  vinCatalogPayloadFromForm,
  type VinCatalogFormState,
} from "@/components/admin/vin-catalog-data-form";

/** Full admin editor payload covering every saveable field. */
function fullForm(): VinCatalogFormState {
  return {
    ...EMPTY_VIN_CATALOG_FORM,
    make: "Kia",
    model: "Sportage",
    year: "2020",
    trim: "EX",
    engine: "2.0",
    transmission: "Automatic",
    fuelType: "Gasoline",
    bodyType: "SUV",
    color: "White",
    country: "kr",
    odometer: "0",
    ownerCount: "0",
    accidentCount: "1",
    hp: "150",
    cylinders: "4",
    titleStatus: "clean",
    isSalvage: false,
    isStolen: true,
    photos: ["https://cdn.example.com/a.jpg", "https://images.other-host.test/b.jpg"],
    accidents: [{
      date: "2022-01-01",
      severity: "minor",
      description: "fender",
      country: "kr",
      type: "collision",
      primaryDamage: "front",
      secondaryDamage: "none",
      airbagDeployed: "no",
      odometerAtLoss: "12000",
      lossAmount: "500",
    }],
    insuranceClaims: [{
      date: "2022-02-01",
      type: "collision",
      lossAmount: "800",
      partCost: "200",
      laborCost: "300",
      paintingCost: "100",
      description: "bumper",
    }],
    mileageHistory: [{
      date: "2023-03-01",
      odometer: "45000",
      unit: "km",
      source: "encar",
      condition: "run_and_drive",
      damage: "none",
      primaryDamage: "none",
      secondaryDamage: "none",
      titleStatus: "clean",
      auctionPrice: "9000",
      lotStatus: "sold",
      location: "Seoul",
      description: "Oil change and brake service",
    }],
    serviceHistory: [{
      date: "2023-06-15",
      mileage: "46000",
      title: "Service",
      location: "Tirana",
      description: "Full inspection and oil filter",
    }],
    ownerHistory: [{
      date: "2019-05-01",
      location: "Seoul",
      mileage: "1000",
      auctionPrice: "",
      lotStatus: "",
      condition: "",
    }],
    auctionHistory: [{
      date: "2021-06-01",
      city: "Incheon",
      state: "",
      country: "kr",
      condition: "run_and_drive",
      damage: "rear",
      primaryDamage: "rear",
      secondaryDamage: "left",
      titleStatus: "salvage",
      openingBid: "1000",
      buyNowPrice: "5000",
      finalPrice: "4200",
      lotStatus: "sold",
    }],
    registryHistory: [{
      date: "2018-01-01",
      type: "registration",
      title: "First registration",
      subtitle: "Owner A",
      mileage: "10",
      amount: "₩1,000",
      location: "Busan",
      details: [{ label: "Use", value: "Private" }],
    }],
    marketData: {
      estimatedValue: "12000",
      currency: "USD",
      lastAuctionPrice: "11000",
      lastAuctionDate: "2021-06-01",
    },
  };
}

describe("vin catalog form save round-trip", () => {
  it("preserves zero numeric scalars (not coerced to null)", () => {
    const payload = vinCatalogPayloadFromForm({
      ...EMPTY_VIN_CATALOG_FORM,
      odometer: "0",
      ownerCount: "0",
      accidentCount: "0",
      year: "0",
      hp: "0",
      cylinders: "0",
    });
    expect(payload.odometer).toBe(0);
    expect(payload.ownerCount).toBe(0);
    expect(payload.accidentCount).toBe(0);
    expect(payload.year).toBe(0);
    expect(payload.hp).toBe(0);
    expect(payload.cylinders).toBe(0);
  });

  it("round-trips every admin editor field including photos and history", () => {
    const form = fullForm();
    const payload = vinCatalogPayloadFromForm(form);
    const restored = vinCatalogFormFromData(payload);

    expect(restored.make).toBe("Kia");
    expect(restored.model).toBe("Sportage");
    expect(restored.year).toBe("2020");
    expect(restored.trim).toBe("EX");
    expect(restored.engine).toBe("2.0");
    expect(restored.transmission).toBe("Automatic");
    expect(restored.fuelType).toBe("Gasoline");
    expect(restored.bodyType).toBe("SUV");
    expect(restored.color).toBe("White");
    expect(restored.country).toBe("kr");
    expect(restored.odometer).toBe("0");
    expect(restored.ownerCount).toBe("0");
    expect(restored.accidentCount).toBe("1");
    expect(restored.hp).toBe("150");
    expect(restored.cylinders).toBe("4");
    expect(restored.titleStatus).toBe("clean");
    expect(restored.isSalvage).toBe(false);
    expect(restored.isStolen).toBe(true);
    expect(restored.photos).toEqual(form.photos);

    expect(payload.mileageHistory).toEqual([expect.objectContaining({
      source: "encar",
      primaryDamage: "none",
      secondaryDamage: "none",
      odometer: 45000,
      location: "Seoul",
      description: "Oil change and brake service",
    })]);
    expect(restored.mileageHistory[0]?.source).toBe("encar");
    expect(restored.mileageHistory[0]?.primaryDamage).toBe("none");
    expect(restored.mileageHistory[0]?.location).toBe("Seoul");
    expect(restored.mileageHistory[0]?.description).toBe("Oil change and brake service");

    expect(payload.serviceHistory).toEqual([expect.objectContaining({
      title: "Service",
      location: "Tirana",
      mileage: 46000,
      description: "Full inspection and oil filter",
    })]);
    expect(restored.serviceHistory[0]?.title).toBe("Service");
    expect(restored.serviceHistory[0]?.location).toBe("Tirana");

    expect(payload.auctionHistory).toEqual([expect.objectContaining({
      primaryDamage: "rear",
      secondaryDamage: "left",
      finalPrice: 4200,
    })]);
    expect(restored.auctionHistory[0]?.primaryDamage).toBe("rear");

    expect(payload.insuranceClaims).toEqual([expect.objectContaining({
      partCost: 200,
      description: "bumper",
    })]);
    expect(restored.insuranceClaims).toHaveLength(1);

    expect(payload.registryHistory).toEqual([expect.objectContaining({
      title: "First registration",
      details: [{ label: "Use", value: "Private" }],
    })]);
    expect(restored.registryHistory[0]?.details[0]?.label).toBe("Use");

    expect(payload.marketData).toEqual({
      estimatedValue: 12000,
      currency: "USD",
      lastAuctionPrice: 11000,
      lastAuctionDate: "2021-06-01",
    });
    expect(restored.marketData.currency).toBe("USD");

    expect(payload.accidents).toEqual([expect.objectContaining({
      airbagDeployed: false,
      primaryDamage: "front",
    })]);
    expect(restored.accidents[0]?.airbagDeployed).toBe("no");
  });

  it("clears empty market data and empty history rows", () => {
    const payload = vinCatalogPayloadFromForm({
      ...EMPTY_VIN_CATALOG_FORM,
      accidents: [{
        date: "", severity: "", description: "", country: "", type: "",
        primaryDamage: "", secondaryDamage: "", airbagDeployed: "",
        odometerAtLoss: "", lossAmount: "",
      }],
      marketData: { estimatedValue: "", currency: "", lastAuctionPrice: "", lastAuctionDate: "" },
    });
    expect(payload.accidents).toEqual([]);
    expect(payload.marketData).toBeNull();
  });
});
