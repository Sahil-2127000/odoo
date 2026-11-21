export const mockKitTemplates = [
  {
    id: 'kit_ongrid_3kw',
    name: '3 kW On-Grid Standard Home Package',
    capacityKw: 3,
    systemType: 'on_grid',
    description: 'Ideal for homes with ₹3,000 - ₹5,000 monthly electricity bill. Net-metering compliant.',
    items: [
      { productId: 'prod_panel_540', productName: 'Mono PERC Solar Panel 540W (Tier-1)', qty: 6, unitPrice: 13500 },
      { productId: 'prod_inv_ongrid_3kw', productName: 'SunPower 3kW On-Grid Smart String Inverter', qty: 1, unitPrice: 38000 },
      { productId: 'prod_structure_elevated', productName: 'Galvanized Iron Elevated Rooftop Mounting Structure', qty: 3, unitPrice: 4200 },
      { productId: 'prod_electrical_kit', productName: 'Safety & Protection Kit (ACDB + DCDB + SPD)', qty: 1, unitPrice: 8500 },
      { productId: 'prod_earthing_kit', productName: 'Chemical Earthing Kit + Copper Lightning Arrester', qty: 1, unitPrice: 6500 },
      { productId: 'prod_cables_wires', productName: 'Solar DC Cable 4 sq.mm (100m Roll) + MC4 Connectors', qty: 1, unitPrice: 4800 },
      { productId: 'prod_install_service', productName: 'Rooftop Fitting, Electrical Testing & Commissioning', qty: 1, unitPrice: 12000 },
    ],
  },
  {
    id: 'kit_ongrid_5kw',
    name: '5 kW On-Grid Commercial / Large Villa Package',
    capacityKw: 5,
    systemType: 'on_grid',
    description: 'Designed for high air-conditioning loads or small factories with ₹6,000+ monthly bill.',
    items: [
      { productId: 'prod_panel_540', productName: 'Mono PERC Solar Panel 540W (Tier-1)', qty: 10, unitPrice: 13500 },
      { productId: 'prod_inv_ongrid_5kw', productName: 'SunPower 5kW On-Grid Smart String Inverter', qty: 1, unitPrice: 52000 },
      { productId: 'prod_structure_elevated', productName: 'Galvanized Iron Elevated Rooftop Mounting Structure', qty: 5, unitPrice: 4200 },
      { productId: 'prod_electrical_kit', productName: 'Safety & Protection Kit (ACDB + DCDB + SPD)', qty: 1, unitPrice: 8500 },
      { productId: 'prod_earthing_kit', productName: 'Chemical Earthing Kit + Copper Lightning Arrester', qty: 2, unitPrice: 6500 },
      { productId: 'prod_cables_wires', productName: 'Solar DC Cable 4 sq.mm (100m Roll) + MC4 Connectors', qty: 2, unitPrice: 4800 },
      { productId: 'prod_install_service', productName: 'Rooftop Fitting, Electrical Testing & Commissioning', qty: 1, unitPrice: 16000 },
    ],
  },
  {
    id: 'kit_offgrid_3kw',
    name: '3 kW Off-Grid Package with 5kWh Battery Backup',
    capacityKw: 3,
    systemType: 'off_grid',
    description: 'Complete independence with LiFePO4 battery backup for areas with frequent power cuts.',
    items: [
      { productId: 'prod_panel_540', productName: 'Mono PERC Solar Panel 540W (Tier-1)', qty: 6, unitPrice: 13500 },
      { productId: 'prod_inv_offgrid_3kw', productName: 'SunPower 3kW Off-Grid Hybrid Inverter', qty: 1, unitPrice: 48000 },
      { productId: 'prod_bat_5kwh', productName: 'SunPower 5.12kWh LiFePO4 Lithium Battery Module', qty: 1, unitPrice: 75000 },
      { productId: 'prod_structure_elevated', productName: 'Galvanized Iron Elevated Rooftop Mounting Structure', qty: 3, unitPrice: 4200 },
      { productId: 'prod_electrical_kit', productName: 'Safety & Protection Kit (ACDB + DCDB + SPD)', qty: 1, unitPrice: 8500 },
      { productId: 'prod_earthing_kit', productName: 'Chemical Earthing Kit + Copper Lightning Arrester', qty: 1, unitPrice: 6500 },
      { productId: 'prod_cables_wires', productName: 'Solar DC Cable 4 sq.mm (100m Roll) + MC4 Connectors', qty: 1, unitPrice: 4800 },
      { productId: 'prod_install_service', productName: 'Rooftop Fitting, Electrical Testing & Commissioning', qty: 1, unitPrice: 14000 },
    ],
  },
];

export default mockKitTemplates;
