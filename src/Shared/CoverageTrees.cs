namespace Demo.Shared;

/// <summary>
/// Coverage trees per tier in AC's policyCoverage.coverages shape. Only Gold
/// is real for now; Bronze and Silver point at the same tree until the real
/// trees are supplied.
/// </summary>
public static class CoverageTrees
{
    public const string Gold = """
        [
            { "code": "salsin_v3",   "name": "Saltsys Individual Single Trip v3", "description": "", "coverSum": 0,        "deductibleSum": null, "subCoverages": [] },
            { "code": "sec1cover1",  "name": "1. EMERGENCY MEDICAL AND RELATED EXPENSES", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec1cover2",  "name": "1.1. Emergency medical expenses including terrorism ", "description": "", "coverSum": 10000000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec1cover3",  "name": " 1.1.1 Excess - insured journey 6 to 12 months", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec1cover4",  "name": " 1.1.2 Excess - insured journey less than 6 months", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec1cover5",  "name": " 1.1.3 Emergency medical expenses when taking part in sport, hazardous activities or adventure sports", "description": "", "coverSum": 250000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec1cover6",  "name": "1.2. Emergency medical and related expenses for a medical condition that existed before your insured journey for journeys up to 31 days (hospital admission must be longer than 48 hours)", "description": "", "coverSum": 100000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec1cover7",  "name": "1.2.1 Emergency medical and related expenses for a medical condition that existed for journeys from the 32nd day onwards (hospital admission must be longer than  48 hours)", "description": "", "coverSum": 30000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec1cover8",  "name": "1.3. Medical evacuation, transport to medical centers, return to country of residency", "description": "Actual expense (part of Emergency medical and related expenses)", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec1cover11", "name": "1.4. Optical expenses - illness and injury", "description": "Included (part of Emergency medical and related expenses)", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec1cover12", "name": "1.5. Dental expenses - illness and injury", "description": "Included (part of Emergency medical and related expenses)", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec1cover13", "name": "1.6. Hospital cash (we pay € 100 a day)", "description": "", "coverSum": 1500, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec1cover14", "name": "1.7. Holiday disruption", "description": "", "coverSum": 300, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec1cover15", "name": "1.8. Refund of emergency telephone charges", "description": "", "coverSum": 300, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec1cover16", "name": "1.9. Refund of in-patient excess (automatic cover excess refund)", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec2cover1",  "name": "2. PERSONAL ACCIDENT", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec2cover2",  "name": "2.1. Death or permanent total disability - excluding air travel (including terrorism)", "description": "", "coverSum": 50000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec2cover3",  "name": "2.2. Death or permanent total disability - insurance for air travel only (including terrorism) ", "description": "", "coverSum": 65000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec2cover4",  "name": "2.3. Education fund supplement", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec3cover1",  "name": "3. TRAVEL ASSIST SERVICES", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec3cover2",  "name": "3.1. Assistance Services", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec3cover3",  "name": " 3.1.1 Cash transfer advice", "description": "Assistance only", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec3cover4",  "name": " 3.1.2 Consular and embassy referral", "description": "Assistance only", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec3cover5",  "name": " 3.1.3 Emergency travel and accommodation arrangements", "description": "Assistance only", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec3cover6",  "name": " 3.1.4 Sending urgent messages", "description": "Assistance only", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec3cover7",  "name": " 3.1.5 Evacuation assistance", "description": "Assistance only", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec3cover8",  "name": "3.2. Visit by a family member", "description": "", "coverSum": 3000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec3cover9",  "name": "3.3. Return of stranded children", "description": "", "coverSum": 3000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec3cover10", "name": "3.4. Return of stranded travel companion", "description": "", "coverSum": 3000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec3cover11", "name": "3.5. Substitute business colleague expenses", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec3cover12", "name": "3.6. Legal assistance when you are abroad", "description": "", "coverSum": 2000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec3cover13", "name": "3.7. Bail money after a traffic accident (you will have to repay this amount to us)", "description": "", "coverSum": 3000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec3cover14", "name": "3.8. Assistance for accompanying spouse or travel companion whilst on a cruise", "description": "", "coverSum": 1500, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec3cover15", "name": "3.9. Burial, cremation or return of mortal remains", "description": "Actual expense (part of Emergency medical and related expenses)", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec3cover16", "name": "3.9.1 Coffin expenses", "description": "", "coverSum": 2000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec3cover17", "name": "3.10. Test for infectious or contagious disease (when you test positive)", "description": "", "coverSum": 200, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec3cover18", "name": "3.10.1 Additional accommodation (when you are not hospitalised as an in-patient) and flight penalties when quarantined on an insured journey due to a positive infectious or contagious disease test", "description": "", "coverSum": 3000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec4cover1",  "name": "4. THE INSURED JOURNEY IS CANCELLED, CHANGED OR CUT SHORT", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec4cover2",  "name": "4.1. Cancelling an insured journey for a named reason ", "description": "", "coverSum": 5000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec4cover3",  "name": "4.1.1 Cancelling an insured journey for an unnamed reason ", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec4cover4",  "name": "4.2. Postponing an insured journey", "description": "", "coverSum": 5000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec4cover5",  "name": "4.3. Cutting an insured journey short for a named reason ", "description": "", "coverSum": 5000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec4cover6",  "name": "4.3.1 Cutting an insured journey short for an unnamed reason", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec4cover7",  "name": "4.4. Ticket change fee", "description": "", "coverSum": 1000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec4cover8",  "name": "4.5. Accommodation expenses due to public transport carrier schedule change", "description": "", "coverSum": 750, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec4cover9",  "name": "4.6. Event and hospitality ticket cancellation cover", "description": "", "coverSum": 1000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec4cover10", "name": "4.6.1 Excess", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec5cover1",  "name": "5. REJECTION OR DELAY OF YOUR VISA APPLICATION", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec5cover2",  "name": "5.1. Rejection of your visa application", "description": "", "coverSum": 4000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec5cover3",  "name": "5.2. Delay of your visa application", "description": "", "coverSum": 1500, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec6cover1",  "name": "6. BAGGAGE, MONEY, BANK CARDS, TRAVELLERS' CHEQUES, TRAVEL DOCUMENTS AND BAGGAGE DELAY", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec6cover2",  "name": "6.1. Theft or damage of baggage (Maximum benefit limit payable under 6.1. Sub-limits apply)", "description": "", "coverSum": 4000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec6cover3",  "name": "6.1.1 Baggage single item limit - theft or damage", "description": "", "coverSum": 1000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec6cover4",  "name": "6.1.2$ Accidental loss of baggage", "description": "", "coverSum": 875, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec6cover5",  "name": "6.1.3 Baggage single item limit - accidental loss", "description": "", "coverSum": 200, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec6cover6",  "name": "6.1.4 Contact lenses, prescription glasses or sunglasses (over and above excess)", "description": "", "coverSum": 100, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec6cover7",  "name": "6.1.5 Computers and similar electronic equipment (over and above excess)", "description": "", "coverSum": 500, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec6cover8",  "name": "6.1.6 Cell phones (over and above excess)", "description": "", "coverSum": 150, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec6cover9",  "name": "6.1.7 Business property", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec6cover10", "name": "6.1.8 Business property - single item limit", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec6cover11", "name": "6.1.9 Excess", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec6cover12", "name": "6.2. Theft of money, cheques and travellers’ cheques, bank cards, postal or money orders (Maximum benefit limit payable under 6.2. Single item limits apply)", "description": "", "coverSum": 1000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec6cover13", "name": "6.2.1 Money, cheques and travellers' cheques, bank cards, postal or money orders - single item limit", "description": "", "coverSum": 250, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec6cover14", "name": "6.2.2 Theft of passport and travel documents", "description": "", "coverSum": 1000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec6cover15", "name": "6.2.3 Excess", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec6cover16", "name": "6.3. Bank card fraud", "description": "", "coverSum": 1000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec6cover17", "name": "6.4. Baggage delay (delayed for more than 6 hours)", "description": "", "coverSum": 1000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec7cover1",  "name": "7. TRAVEL DELAY, MISSED CONNECTION AND MISSED EVENT", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec7cover2",  "name": "7.1. Travel delay (delayed for more than 4 hours)", "description": "", "coverSum": 500, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec7cover3",  "name": "7.2. Cost of alternative travel due to travel delay", "description": "", "coverSum": 3000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec7cover4",  "name": "7.3. Missed connection (no alternative transport available for more than 6 hours)", "description": "", "coverSum": 3000, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec7cover5",  "name": "7.3.1 Additional car parking costs due to travel delay or missed connection", "description": "", "coverSum": 250, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec7cover6",  "name": "7.4. Missed pre-paid event or activity", "description": "", "coverSum": 750, "deductibleSum": null, "subCoverages": [] },
            { "code": "sec7cover7",  "name": "7.5. Lounge access due to travel delay or missed connection", "description": "", "coverSum": 300, "deductibleSum": null, "subCoverages": [] },
            { "code": "premium",     "name": "Premium", "description": "", "coverSum": 0, "deductibleSum": null, "subCoverages": [] }
        ]
        """;

    // Until real trees arrive, the same Gold tree is used for Bronze and Silver too.
    public const string Silver = Gold;
    public const string Bronze = Gold;
}
