import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import {
  buildPaginatedResponse,
  PaginatedResponseDto,
} from '../../common/dto/paginated-response.dto';
import { SAFE_USER_SELECT } from '../../common/constants/user-select';
import {
  normalizePagination,
  normalizeSearchTerm,
  resolveSort,
} from '../../common/utils/query.utils';
import { Company } from '@prisma/client';

const COMPANY_SORT_FIELDS = [
  'id',
  'name',
  'industry',
  'city',
  'supervisorName',
  'createdAt',
  'updatedAt',
] as const;

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCompanyDto): Promise<Company> {
    return this.prisma.company.create({
      data: dto,
    });
  }

  async findAll(query: PaginationQueryDto): Promise<PaginatedResponseDto<Company>> {
    const { page, limit, skip } = normalizePagination(query.page, query.limit);
    const searchTerm = normalizeSearchTerm(query.search);

    const where: any = {};
    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { industry: { contains: searchTerm, mode: 'insensitive' } },
        { city: { contains: searchTerm, mode: 'insensitive' } },
        { supervisorName: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    const { orderBy, sortBy, sortOrder } = resolveSort(
      query.sortBy,
      query.sortOrder,
      COMPANY_SORT_FIELDS,
      'id',
      'desc',
    );

    const [items, total] = await Promise.all([
      this.prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy,
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

    return buildPaginatedResponse(items, total, page, limit, {
      searchTerm,
      sortBy,
      sortOrder,
    });
  }

  async findOne(id: number): Promise<Company> {
    const company = await this.prisma.company.findUnique({
      where: { id },
      include: {
        internships: {
          where: { deletedAt: null },
          include: {
            student: {
              include: { user: { select: SAFE_USER_SELECT } },
            },
          },
        },
        requests: {
          where: { deletedAt: null },
          include: {
            student: {
              include: { user: { select: SAFE_USER_SELECT } },
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

  async update(id: number, dto: UpdateCompanyDto): Promise<Company> {
    await this.findOne(id);
    return this.prisma.company.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number): Promise<{ message: string }> {
    await this.findOne(id);
    await this.prisma.company.delete({ where: { id } });
    return { message: `Company with ID '${id}' successfully deleted` };
  }
}
