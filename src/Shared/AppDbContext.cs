using Microsoft.EntityFrameworkCore;

namespace Demo.Shared;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    // Entities (Policy, Claim, etc.) land in the next commit.
}
