import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PaginationQueryDto, PaginatedResult } from '../../common/dto/pagination-query.dto';
import { Company } from '@prisma/client';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCompanyDto): Promise<Company> {
    return this.prisma.company.create({
      data: dto,
    });
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResult<Company>> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { industry: { contains: query.search, mode: 'insensitive' } },
        { city: { contains: query.search, mode: 'insensitive' } },
        { supervisorName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [items, totalItems] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [query.sortBy || 'createdAt']: query.sortOrder || 'desc' },
        include: {
          _count: {
            select: {
              internships: true,
              requests: true,
            },
          },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      items,
      meta: {
        totalItems,
        itemCount: items.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
      },
    };
  }

  async findOne(id: string): Promise<Company> {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        internships: {
          include: {
            student: {
              include: { user: { select: { firstName: true, lastName: true, email: true } } },
            },
          },
        },
        requests: {
          include: {
            student: {
              include: { user: { select: { firstName: true, lastName: true } } },
            },
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException(`Company with ID '${id}' not found`);
    }

    return company;
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<Company> {
    await this.findOne(id);
    return this.prisma.company.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string): Promise<{ message: string }> {
    await this.findOne(id);
    await this.prisma.company.delete({ where: { id } });
    return { message: `Company with ID '${id}' successfully deleted` };
  }
}
