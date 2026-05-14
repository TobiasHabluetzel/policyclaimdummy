using Microsoft.EntityFrameworkCore;

namespace Demo.Shared;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Insured> Insureds => Set<Insured>();
    public DbSet<Policy> Policies => Set<Policy>();
    public DbSet<PolicyInsured> PolicyInsureds => Set<PolicyInsured>();
    public DbSet<CoverageTemplate> CoverageTemplates => Set<CoverageTemplate>();
    public DbSet<Claim> Claims => Set<Claim>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // Display numbers start at 1001 and are formatted as P-YYYY-NNNNNN.
        mb.HasSequence<int>("policy_number_seq").StartsAt(1001);

        mb.Entity<Insured>(e =>
        {
            e.HasKey(x => x.Id);
            // Unique across all Insureds. Postgres allows multiple NULLs by
            // default, so additional insureds without an email don't clash.
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.FirstName).HasMaxLength(100);
            e.Property(x => x.LastName).HasMaxLength(100);
            e.Property(x => x.Email).HasMaxLength(200);
            e.Property(x => x.PhoneNumber).HasMaxLength(50);
            e.Property(x => x.IdentityNumber).HasMaxLength(64);
        });

        mb.Entity<Policy>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.DisplayNumber).IsUnique();
            e.Property(x => x.DisplayNumber).HasMaxLength(32);
            e.Property(x => x.Destination).HasMaxLength(200);
            e.Property(x => x.CurrencyCode).HasMaxLength(3);
            e.Property(x => x.Tier).HasConversion<string>().HasMaxLength(16);
            e.Property(x => x.Duration).HasConversion<string>().HasMaxLength(16);
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(16);
        });

        mb.Entity<PolicyInsured>(e =>
        {
            e.HasKey(x => new { x.PolicyId, x.InsuredId });
            e.HasOne(x => x.Policy).WithMany(p => p.InsuredLinks).HasForeignKey(x => x.PolicyId);
            e.HasOne(x => x.Insured).WithMany(i => i.PolicyLinks).HasForeignKey(x => x.InsuredId);
        });

        mb.Entity<CoverageTemplate>(e =>
        {
            e.HasKey(x => x.Tier);
            e.Property(x => x.Tier).HasConversion<string>().HasMaxLength(16);
            e.Property(x => x.Name).HasMaxLength(100);
            e.Property(x => x.CoverageJson).HasColumnType("jsonb");
        });

        mb.Entity<Claim>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.ShortCode).IsUnique();
            e.HasIndex(x => x.AcClaimId);
            e.Property(x => x.ShortCode).HasMaxLength(32);
            e.Property(x => x.AcClaimId).HasMaxLength(64);
            e.Property(x => x.Status).HasMaxLength(32);
            e.Property(x => x.PolicyReference).HasMaxLength(64);
            e.Property(x => x.ProductCode).HasMaxLength(64);
            e.Property(x => x.Currency).HasMaxLength(8);
            e.Property(x => x.CostsJson).HasColumnType("jsonb");
            e.Property(x => x.DocumentsJson).HasColumnType("jsonb");
            e.Property(x => x.ReviewJson).HasColumnType("jsonb");
        });
    }
}
